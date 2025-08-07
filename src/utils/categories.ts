export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'food', name: 'Nourriture & Restaurants', icon: '🍽️', color: '#f59e0b' },
  { id: 'transport', name: 'Transport', icon: '🚗', color: '#3b82f6' },
  { id: 'accommodation', name: 'Logement', icon: '🏠', color: '#10b981' },
  { id: 'entertainment', name: 'Divertissement', icon: '🎬', color: '#8b5cf6' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#ec4899' },
  { id: 'health', name: 'Santé & Pharmacie', icon: '💊', color: '#ef4444' },
  { id: 'utilities', name: 'Services & Factures', icon: '⚡', color: '#6b7280' },
  { id: 'education', name: 'Éducation', icon: '📚', color: '#0ea5e9' },
  { id: 'gifts', name: 'Cadeaux', icon: '🎁', color: '#f97316' },
  { id: 'sports', name: 'Sport & Fitness', icon: '⚽', color: '#22c55e' },
  { id: 'travel', name: 'Voyage', icon: '✈️', color: '#06b6d4' },
  { id: 'other', name: 'Autres', icon: '📝', color: '#64748b' }
];

export function getCategoryById(id: string): ExpenseCategory | undefined {
  return EXPENSE_CATEGORIES.find(cat => cat.id === id);
}

export function getCategoryColor(categoryId?: string): string {
  const category = categoryId ? getCategoryById(categoryId) : null;
  return category?.color || '#64748b';
}

export function getCategoryIcon(categoryId?: string): string {
  const category = categoryId ? getCategoryById(categoryId) : null;
  return category?.icon || '📝';
}

export function getCategoryName(categoryId?: string): string {
  const category = categoryId ? getCategoryById(categoryId) : null;
  return category?.name || 'Non catégorisé';
}