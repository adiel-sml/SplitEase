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
  paidBy: string;
  splitBetween: { memberId: string; amount?: number }[];
  date: Date;
  category?: string;
  createdAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  image?: string;
  members: Member[];
  expenses: Expense[];
  createdAt: Date;
  lastActivity: Date;
}

export interface Balance {
  memberId: string;
  memberName: string;
  balance: number;
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