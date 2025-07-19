import { supabase, handleSupabaseError, requireAuth } from '../lib/supabase';
import { Group, Expense, Member, Settlement } from '../types';
import { generateAvatar } from '../utils/avatars';

export class SupabaseDataService {
  private static instance: SupabaseDataService;

  static getInstance(): SupabaseDataService {
    if (!SupabaseDataService.instance) {
      SupabaseDataService.instance = new SupabaseDataService();
    }
    return SupabaseDataService.instance;
  }

  // Groups
  async getGroups(): Promise<Group[]> {
    try {
      const user = await requireAuth();
      
      const { data: groupsData, error } = await supabase
        .from('groups')
        .select(`
          *,
          members (
            id,
            user_id,
            name,
            email,
            avatar_url,
            color,
            joined_at
          ),
          expenses (
            id,
            description,
            amount,
            paid_by,
            date,
            category,
            created_at,
            expense_splits (
              member_id,
              amount
            )
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) handleSupabaseError(error);

      return groupsData.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description || undefined,
        image: group.image_url || undefined,
        members: group.members.map(member => ({
          id: member.id,
          name: member.name,
          email: member.email || undefined,
          avatar: member.avatar_url || generateAvatar(member.name).avatar,
          color: member.color
        })),
        expenses: group.expenses.map(expense => ({
          id: expense.id,
          groupId: group.id,
          description: expense.description,
          amount: expense.amount,
          paidBy: expense.paid_by,
          splitBetween: expense.expense_splits.map(split => ({
            memberId: split.member_id,
            amount: split.amount
          })),
          date: new Date(expense.date),
          category: expense.category || undefined,
          createdAt: new Date(expense.created_at)
        })),
        createdAt: new Date(group.created_at),
        lastActivity: new Date(group.updated_at)
      }));
    } catch (error) {
      console.error('Error loading groups:', error);
      throw error;
    }
  }

 async saveGroup(group: Group): Promise<void> {
  try {
    const user = await requireAuth();

    // Si l'ID n'est pas un UUID, on ne cherche pas le groupe (création)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(group.id || '');
    let groupId = group.id;

    if (isUuid) {
      const { data: existingGroup } = await supabase
        .from('groups')
        .select('id')
        .eq('id', group.id)
        .single();

      if (existingGroup) {
        // Update
        const { error: groupError } = await supabase
          .from('groups')
          .update({
            name: group.name,
            description: group.description,
            image_url: group.image,
            updated_at: new Date().toISOString()
          })
          .eq('id', group.id);

        if (groupError) handleSupabaseError(groupError);
        return;
      }
    }

    // Create new group
    const { data: insertedGroup, error: groupError } = await supabase
      .from('groups')
      .insert({
        name: group.name,
        description: group.description,
        image_url: group.image,
        created_by: user.id
      })
      .select()
      .single();

    if (groupError) handleSupabaseError(groupError);

    groupId = insertedGroup.id;

    // Add creator as first member
    const members = group.members || [];
    const creatorMember = members.find(m => m.email === user.email) || members[0];

    if (creatorMember) {
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          name: creatorMember.name,
          email: user.email,
          avatar_url: creatorMember.avatar,
          color: creatorMember.color
        });

      if (memberError) handleSupabaseError(memberError);
    }
  } catch (error) {
    console.error('Error saving group:', error);
    throw error;
  }
}


  async deleteGroup(groupId: string): Promise<void> {
    try {
      await requireAuth();
      
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) handleSupabaseError(error);
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }

  async getGroup(groupId: string): Promise<Group | undefined> {
    try {
      const groups = await this.getGroups();
      return groups.find(g => g.id === groupId);
    } catch (error) {
      console.error('Error getting group:', error);
      throw error;
    }
  }

  // Expenses
  async addExpense(expense: Expense): Promise<void> {
    try {
      const user = await requireAuth();
      
      // Insert expense
      const { error: expenseError } = await supabase
        .from('expenses')
        .insert({
          id: expense.id,
          group_id: expense.groupId,
          description: expense.description,
          amount: expense.amount,
          paid_by: expense.paidBy,
          date: expense.date.toISOString().split('T')[0],
          category: expense.category,
          created_by: user.id
        });

      if (expenseError) handleSupabaseError(expenseError);

      // Insert expense splits
      const splits = expense.splitBetween.map(split => ({
        expense_id: expense.id,
        member_id: split.memberId,
        amount: split.amount || (expense.amount / expense.splitBetween.length)
      }));

      const { error: splitsError } = await supabase
        .from('expense_splits')
        .insert(splits);

      if (splitsError) handleSupabaseError(splitsError);

      // Update group's last activity
      const { error: updateError } = await supabase
        .from('groups')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', expense.groupId);

      if (updateError) handleSupabaseError(updateError);
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  async updateExpense(expense: Expense): Promise<void> {
    try {
      const user = await requireAuth();
      
      // Update expense
      const { error: expenseError } = await supabase
        .from('expenses')
        .update({
          description: expense.description,
          amount: expense.amount,
          paid_by: expense.paidBy,
          date: expense.date.toISOString().split('T')[0],
          category: expense.category,
          updated_at: new Date().toISOString()
        })
        .eq('id', expense.id);

      if (expenseError) handleSupabaseError(expenseError);

      // Delete existing splits
      const { error: deleteError } = await supabase
        .from('expense_splits')
        .delete()
        .eq('expense_id', expense.id);

      if (deleteError) handleSupabaseError(deleteError);

      // Insert new splits
      const splits = expense.splitBetween.map(split => ({
        expense_id: expense.id,
        member_id: split.memberId,
        amount: split.amount || (expense.amount / expense.splitBetween.length)
      }));

      const { error: splitsError } = await supabase
        .from('expense_splits')
        .insert(splits);

      if (splitsError) handleSupabaseError(splitsError);

      // Update group's last activity
      const { error: updateError } = await supabase
        .from('groups')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', expense.groupId);

      if (updateError) handleSupabaseError(updateError);
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  async deleteExpense(groupId: string, expenseId: string): Promise<void> {
    try {
      await requireAuth();
      
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) handleSupabaseError(error);

      // Update group's last activity
      const { error: updateError } = await supabase
        .from('groups')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', groupId);

      if (updateError) handleSupabaseError(updateError);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  // Settlements
  async getSettlements(groupId: string): Promise<Settlement[]> {
    try {
      await requireAuth();
      
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .eq('group_id', groupId)
        .order('settled_at', { ascending: false });

      if (error) handleSupabaseError(error);

      return data.map(settlement => ({
        id: settlement.id,
        groupId: settlement.group_id,
        from: settlement.from_member,
        to: settlement.to_member,
        amount: settlement.amount,
        settled: true,
        settledAt: new Date(settlement.settled_at),
        createdAt: new Date(settlement.settled_at)
      }));
    } catch (error) {
      console.error('Error loading settlements:', error);
      throw error;
    }
  }

  async saveSettlement(settlement: Settlement): Promise<void> {
    try {
      const user = await requireAuth();
      
      const { error } = await supabase
        .from('settlements')
        .insert({
          id: settlement.id,
          group_id: settlement.groupId,
          from_member: settlement.from,
          to_member: settlement.to,
          amount: settlement.amount,
          created_by: user.id,
          notes: `Remboursement confirmé via SplitEase`
        });

      if (error) handleSupabaseError(error);
    } catch (error) {
      console.error('Error saving settlement:', error);
      throw error;
    }
  }

  // Authentication helpers
  async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    });

    if (error) handleSupabaseError(error);
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) handleSupabaseError(error);
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) handleSupabaseError(error);
  }

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) handleSupabaseError(error);
    return user;
  }

  // Real-time subscriptions
  subscribeToGroupChanges(groupId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`group-${groupId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'expenses', filter: `group_id=eq.${groupId}` },
        callback
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'members', filter: `group_id=eq.${groupId}` },
        callback
      )
      .subscribe();
  }

  // Export data
  async exportGroupData(groupId: string): Promise<string> {
    try {
      const group = await this.getGroup(groupId);
      if (!group) throw new Error('Group not found');

      const csvHeader = 'Date,Description,Amount,Paid By,Split Between,Category\n';
      const csvRows = group.expenses.map(expense => {
        const splitBetween = expense.splitBetween
          .map(s => group.members.find(m => m.id === s.memberId)?.name)
          .join('; ');
        const paidBy = group.members.find(m => m.id === expense.paidBy)?.name;
        
        return `${expense.date.toLocaleDateString()},${expense.description},${expense.amount},${paidBy},"${splitBetween}",${expense.category || ''}`;
      }).join('\n');

      return csvHeader + csvRows;
    } catch (error) {
      console.error('Error exporting group data:', error);
      throw error;
    }
  }

  // Theme (still using localStorage for user preference)
  getTheme(): 'light' | 'dark' {
    return localStorage.getItem('splitease_theme') as 'light' | 'dark' || 'light';
  }

  saveTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem('splitease_theme', theme);
  }
}