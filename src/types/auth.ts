export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  timezone: string;
  language: string;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserContact {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  source: 'manual' | 'device' | 'csv';
  is_splitease_user: boolean;
  splitease_user_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  // Fréquences
  expense_notifications: 'immediate' | 'daily' | 'weekly' | 'disabled';
  reminder_notifications: 'daily' | 'weekly' | 'monthly' | 'disabled';
  group_activity: 'immediate' | 'daily' | 'weekly' | 'disabled';
  // Types de notifications
  new_expense: boolean;
  expense_updated: boolean;
  debt_reminder: boolean;
  payment_received: boolean;
  group_invitation: boolean;
  group_activity_summary: boolean;
  // Paramètres avancés
  quiet_hours_start: string;
  quiet_hours_end: string;
  weekend_notifications: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  type: 'email' | 'push' | 'sms';
  channel: string;
  status: 'sent' | 'delivered' | 'failed' | 'bounced';
  recipient: string;
  subject?: string;
  content: string;
  metadata: Record<string, any>;
  sent_at: Date;
  delivered_at?: Date;
  error_message?: string;
}

export interface GroupInvitation {
  id: string;
  group_id: string;
  email: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined';
  invitation_type: 'email' | 'qr' | 'magic_link';
  custom_message?: string;
  magic_token?: string;
  qr_code_data?: string;
  expires_at: Date;
  accepted_at?: Date;
  declined_at?: Date;
  created_at: Date;
}

export interface ReminderSchedule {
  id: string;
  group_id: string;
  user_id: string;
  reminder_type: 'debt' | 'expense_approval' | 'group_activity';
  frequency: 'daily' | 'weekly' | 'monthly';
  next_run_at: Date;
  last_run_at?: Date;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: { username: string; full_name: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}