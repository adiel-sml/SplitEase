export interface Member {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  color: string;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  splitBetween: { memberId: string; amount?: number }[];
  date: Date;
  category?: string;
  comments?: Comment[];
  attachments?: Attachment[];
  createdAt: Date;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document';
  size: number;
  uploadedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  image?: string;
  currency: string;
  budget?: number;
  members: Member[];
  expenses: Expense[];
  createdAt: Date;
  lastActivity: Date;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Taux par rapport à EUR
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Balance {
  memberId: string;
  memberName: string;
  balance: number;
  currency: string;
}

export interface Transaction {
  from: string;
  to: string;
  amount: number;
  fromName: string;
  toName: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  from: string;
  to: string;
  amount: number;
  settled: boolean;
  settledAt?: Date;
  createdAt: Date;
}

export type Theme = 'light' | 'dark';