import { Group, Expense, Member, Settlement } from '../types';

export class DataService {
  private static instance: DataService;
  private readonly STORAGE_KEYS = {
    groups: 'splitease_groups',
    expenses: 'splitease_expenses',
    settlements: 'splitease_settlements',
    theme: 'splitease_theme'
  };

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // Groups
  async getGroups(): Promise<Group[]> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.groups);
      if (!data) return [];
      
      const groups = JSON.parse(data);
      return groups.map((group: any) => ({
        ...group,
        createdAt: new Date(group.createdAt),
        lastActivity: new Date(group.lastActivity),
        expenses: group.expenses.map((expense: any) => ({
          ...expense,
          date: new Date(expense.date),
          createdAt: new Date(expense.createdAt)
        }))
      }));
    } catch (error) {
      console.error('Error loading groups:', error);
      return [];
    }
  }

  async saveGroup(group: Group): Promise<void> {
    try {
      const groups = await this.getGroups();
      const existingIndex = groups.findIndex(g => g.id === group.id);
      
      if (existingIndex >= 0) {
        groups[existingIndex] = group;
      } else {
        groups.push(group);
      }
      
      localStorage.setItem(this.STORAGE_KEYS.groups, JSON.stringify(groups));
    } catch (error) {
      console.error('Error saving group:', error);
      throw new Error('Failed to save group');
    }
  }

  async deleteGroup(groupId: string): Promise<void> {
    try {
      const groups = await this.getGroups();
      const filteredGroups = groups.filter(g => g.id !== groupId);
      localStorage.setItem(this.STORAGE_KEYS.groups, JSON.stringify(filteredGroups));
    } catch (error) {
      console.error('Error deleting group:', error);
      throw new Error('Failed to delete group');
    }
  }

  async getGroup(groupId: string): Promise<Group | undefined> {
    const groups = await this.getGroups();
    return groups.find(g => g.id === groupId);
  }

  // Expenses
  async addExpense(expense: Expense): Promise<void> {
    try {
      const group = await this.getGroup(expense.groupId);
      if (!group) throw new Error('Group not found');
      
      group.expenses.push(expense);
      group.lastActivity = new Date();
      await this.saveGroup(group);
    } catch (error) {
      console.error('Error adding expense:', error);
      throw new Error('Failed to add expense');
    }
  }

  async updateExpense(expense: Expense): Promise<void> {
    try {
      const group = await this.getGroup(expense.groupId);
      if (!group) throw new Error('Group not found');
      
      const expenseIndex = group.expenses.findIndex(e => e.id === expense.id);
      if (expenseIndex >= 0) {
        group.expenses[expenseIndex] = expense;
        group.lastActivity = new Date();
        await this.saveGroup(group);
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      throw new Error('Failed to update expense');
    }
  }

  async deleteExpense(groupId: string, expenseId: string): Promise<void> {
    try {
      const group = await this.getGroup(groupId);
      if (!group) throw new Error('Group not found');
      
      group.expenses = group.expenses.filter(e => e.id !== expenseId);
      group.lastActivity = new Date();
      await this.saveGroup(group);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw new Error('Failed to delete expense');
    }
  }

  // Settlements
  async getSettlements(groupId: string): Promise<Settlement[]> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.settlements);
      if (!data) return [];
      
      const settlements = JSON.parse(data);
      return settlements
        .filter((s: Settlement) => s.groupId === groupId)
        .map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          settledAt: s.settledAt ? new Date(s.settledAt) : undefined
        }));
    } catch (error) {
      console.error('Error loading settlements:', error);
      return [];
    }
  }

  async saveSettlement(settlement: Settlement): Promise<void> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.settlements);
      const settlements = data ? JSON.parse(data) : [];
      
      const existingIndex = settlements.findIndex((s: Settlement) => s.id === settlement.id);
      if (existingIndex >= 0) {
        settlements[existingIndex] = settlement;
      } else {
        settlements.push(settlement);
      }
      
      localStorage.setItem(this.STORAGE_KEYS.settlements, JSON.stringify(settlements));
    } catch (error) {
      console.error('Error saving settlement:', error);
      throw new Error('Failed to save settlement');
    }
  }

  // Theme
  getTheme(): 'light' | 'dark' {
    return localStorage.getItem(this.STORAGE_KEYS.theme) as 'light' | 'dark' || 'light';
  }

  saveTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(this.STORAGE_KEYS.theme, theme);
  }

  // Export data
  async exportGroupData(groupId: string): Promise<string> {
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
  }
}