import React from 'react';
import { Users, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Group } from '../../types';
import { ExpenseCalculator } from '../../utils/calculations';

interface GroupCardProps {
  group: Group;
  onClick: () => void;
}

export function GroupCard({ group, onClick }: GroupCardProps) {
  const totalExpenses = ExpenseCalculator.getTotalExpenses(group);
  const balances = ExpenseCalculator.calculateBalances(group);
  const myBalance = balances.find(b => b.memberId === 'current-user')?.balance || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600 dark:text-green-400';
    if (balance < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return TrendingUp;
    if (balance < 0) return TrendingDown;
    return Minus;
  };

  const BalanceIcon = getBalanceIcon(myBalance);

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {group.name}
            </h3>
            {group.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {group.description}
              </p>
            )}
          </div>
          {group.image && (
            <img
              src={group.image}
              alt={group.name}
              className="w-12 h-12 rounded-lg object-cover ml-4"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {group.members.length} membres
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {group.lastActivity.toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total dépenses</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Votre solde</p>
            <div className={`flex items-center gap-1 ${getBalanceColor(myBalance)}`}>
              <BalanceIcon className="w-4 h-4" />
              <span className="font-semibold">
                {formatCurrency(Math.abs(myBalance))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}