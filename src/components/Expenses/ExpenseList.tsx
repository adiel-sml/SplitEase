import React, { useState } from 'react';
import { Edit, Trash2, Calendar, User, Users, MessageCircle } from 'lucide-react';
import { Group, Expense } from '../../types';
import { Button } from '../UI/Button';
import { SearchInput } from '../UI/SearchInput';
import { CurrencyService } from '../../utils/currencies';
import { getCategoryIcon, getCategoryName, EXPENSE_CATEGORIES } from '../../utils/categories';

interface ExpenseListProps {
  group: Group;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export function ExpenseList({ group, onEditExpense, onDeleteExpense }: ExpenseListProps) {
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const currencyService = CurrencyService.getInstance();

  const formatCurrency = (amount: number, currency: string = group.currency) => {
    return currencyService.formatCurrency(amount, currency);
  };

  const sortedExpenses = [...group.expenses].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    return b.amount - a.amount;
  });

  const filteredExpenses = sortedExpenses.filter(expense => {
    const matchesPayer = filterBy === 'all' || expense.paidBy === filterBy;
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    const matchesSearch = !searchTerm || 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCategoryName(expense.category).toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesPayer && matchesCategory && matchesSearch;
  });

  const getMemberName = (memberId: string) => {
    return group.members.find(m => m.id === memberId)?.name || 'Inconnu';
  };

  const getSplitSummary = (expense: Expense) => {
    const memberNames = expense.splitBetween.map(split => 
      getMemberName(split.memberId)
    );
    
    if (memberNames.length === group.members.length) {
      return 'Tous les membres';
    }
    
    if (memberNames.length <= 2) {
      return memberNames.join(', ');
    }
    
    return `${memberNames[0]} et ${memberNames.length - 1} autres`;
  };

  if (group.expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Aucune dépense
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Commencez par ajouter une première dépense pour ce groupe.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Rechercher une dépense..."
        />
        
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="date">Trier par date</option>
            <option value="amount">Trier par montant</option>
          </select>
          
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">Tous les payeurs</option>
            {group.members.map(member => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">Toutes catégories</option>
            {EXPENSE_CATEGORIES.map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredExpenses.map((expense) => (
          <div
            key={expense.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getCategoryIcon(expense.category)}</span>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {expense.description}
                  </h4>
                </div>
                <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                  {getCategoryName(expense.category)}
                </span>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(expense.amount, expense.currency)}
                </div>
                {expense.currency !== group.currency && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Devise: {expense.currency}
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{expense.date.toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Payé par {getMemberName(expense.paidBy)}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4" />
                <span>{getSplitSummary(expense)}</span>
                {expense.comments && expense.comments.length > 0 && (
                  <div className="flex items-center gap-1 ml-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>{expense.comments.length}</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditExpense(expense)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onDeleteExpense(expense.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}