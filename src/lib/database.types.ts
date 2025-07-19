export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          name: string
          email: string | null
          avatar_url: string | null
          color: string
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          name: string
          email?: string | null
          avatar_url?: string | null
          color?: string
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          name?: string
          email?: string | null
          avatar_url?: string | null
          color?: string
          joined_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          group_id: string
          description: string
          amount: number
          paid_by: string
          date: string
          category: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          description: string
          amount: number
          paid_by: string
          date?: string
          category?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          description?: string
          amount?: number
          paid_by?: string
          date?: string
          category?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      expense_splits: {
        Row: {
          id: string
          expense_id: string
          member_id: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          expense_id: string
          member_id: string
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          expense_id?: string
          member_id?: string
          amount?: number
          created_at?: string
        }
      }
      settlements: {
        Row: {
          id: string
          group_id: string
          from_member: string
          to_member: string
          amount: number
          settled_at: string
          created_by: string
          notes: string | null
        }
        Insert: {
          id?: string
          group_id: string
          from_member: string
          to_member: string
          amount: number
          settled_at?: string
          created_by: string
          notes?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          from_member?: string
          to_member?: string
          amount?: number
          settled_at?: string
          created_by?: string
          notes?: string | null
        }
      }
      group_invitations: {
        Row: {
          id: string
          group_id: string
          email: string
          invited_by: string
          status: 'pending' | 'accepted' | 'declined'
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          email: string
          invited_by: string
          status?: 'pending' | 'accepted' | 'declined'
          expires_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          email?: string
          invited_by?: string
          status?: 'pending' | 'accepted' | 'declined'
          expires_at?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_invitations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}