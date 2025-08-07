import React from 'react';
import { Group } from '../../types';
import { getCategoryName, getCategoryColor, EXPENSE_CATEGORIES } from '../../utils/categories';
import { CurrencyService } from '../../utils/currencies';

interface ExpenseChartProps {
  group: Group;
}

export function ExpenseChart({ group }: ExpenseChartProps) {
  const currencyService = CurrencyService.getInstance();

  // Calcul des dépenses par catégorie
  const categoryTotals = group.expenses.reduce((acc, expense) => {
    const category = expense.category || 'other';
    acc[category] = (acc[category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalAmount = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
  
  const categoryData = Object.entries(categoryTotals)
    .map(([categoryId, amount]) => ({
      categoryId,
      name: getCategoryName(categoryId),
      amount,
      percentage: (amount / totalAmount) * 100,
      color: getCategoryColor(categoryId)
    }))
    .sort((a, b) => b.amount - a.amount);

  // Calcul des dépenses par membre
  const memberTotals = group.expenses.reduce((acc, expense) => {
    const member = group.members.find(m => m.id === expense.paidBy);
    if (member) {
      acc[member.id] = (acc[member.id] || 0) + expense.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  const memberData = Object.entries(memberTotals)
    .map(([memberId, amount]) => {
      const member = group.members.find(m => m.id === memberId);
      return {
        memberId,
        name: member?.name || 'Inconnu',
        amount,
        percentage: (amount / totalAmount) * 100,
        color: member?.color || '#64748b'
      };
    })
    .sort((a, b) => b.amount - a.amount);

  if (group.expenses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          Aucune donnée à afficher
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Graphique par catégories */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Dépenses par catégorie
        </h3>
        
        <div className="space-y-3">
          {categoryData.map((category) => (
            <div key={category.categoryId} className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: category.color }}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {category.name}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {currencyService.formatCurrency(category.amount, group.currency)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: category.color,
                      width: `${category.percentage}%`
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {category.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Graphique par membre */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Dépenses par membre
        </h3>
        
        <div className="space-y-3">
          {memberData.map((member) => (
            <div key={member.memberId} className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: member.color }}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {member.name}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {currencyService.formatCurrency(member.amount, group.currency)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: member.color,
                      width: `${member.percentage}%`
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {member.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statistiques générales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {group.expenses.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Dépenses totales
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {currencyService.formatCurrency(totalAmount / group.expenses.length, group.currency)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Dépense moyenne
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {categoryData.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Catégories utilisées
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {currencyService.formatCurrency(Math.max(...Object.values(memberTotals)), group.currency)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Plus grosse dépense
          </div>
        </div>
      </div>
    </div>
  );
}