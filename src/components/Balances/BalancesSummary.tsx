import React from 'react';
import { TrendingUp, TrendingDown, Minus, CheckCircle, Users, Calculator, ArrowRight } from 'lucide-react';
import { Group, Transaction } from '../../types';
import { ExpenseCalculator } from '../../utils/calculations';
import { Button } from '../UI/Button';

interface BalancesSummaryProps {
  group: Group;
  onSettleDebt: (transaction: Transaction) => void;
}

export function BalancesSummary({ group, onSettleDebt }: BalancesSummaryProps) {
  const balances = ExpenseCalculator.calculateBalances(group);
  const transactions = ExpenseCalculator.simplifyDebts(balances);
  const optimizationStats = ExpenseCalculator.getOptimizationStats(balances);

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

  const getBalanceCardColor = (balance: number) => {
    if (balance > 0) return 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800';
    if (balance < 0) return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800';
    return 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600';
  };

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return TrendingUp;
    if (balance < 0) return TrendingDown;
    return Minus;
  };

  const getMemberAvatar = (memberId: string) => {
    return group.members.find(m => m.id === memberId)?.avatar || '';
  };

  const getMemberColor = (memberId: string) => {
    return group.members.find(m => m.id === memberId)?.color || '#6B7280';
  };
  
  return (
    <div className="space-y-6">
      {/* Optimization Stats */}
      {optimizationStats.totalTransactions > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Optimisation des remboursements
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {optimizationStats.totalTransactions}
              </div>
              <div className="text-blue-700 dark:text-blue-300">
                Transaction{optimizationStats.totalTransactions > 1 ? 's' : ''} nécessaire{optimizationStats.totalTransactions > 1 ? 's' : ''}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(optimizationStats.totalAmount)}
              </div>
              <div className="text-blue-700 dark:text-blue-300">
                Montant total
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(optimizationStats.maxTransaction)}
              </div>
              <div className="text-blue-700 dark:text-blue-300">
                Plus gros remboursement
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balances Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Soldes des membres
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {balances.map((balance) => {
            const BalanceIcon = getBalanceIcon(balance.balance);
            const memberColor = getMemberColor(balance.memberId);
            
            return (
              <div
                key={balance.memberId}
                className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${getBalanceCardColor(balance.balance)}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={getMemberAvatar(balance.memberId)}
                    alt={balance.memberName}
                    className="w-10 h-10 rounded-full border-2"
                    style={{ borderColor: memberColor }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {balance.memberName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {balance.balance > 0 ? 'À recevoir' : balance.balance < 0 ? 'À rembourser' : 'Équilibré'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 ${getBalanceColor(balance.balance)}`}>
                    <BalanceIcon className="w-4 h-4" />
                    <span className="font-bold text-lg">
                      {formatCurrency(Math.abs(balance.balance))}
                    </span>
                  </div>
                  
                  {balance.balance !== 0 && (
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: memberColor }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile-optimized member cards for small screens */}
      <div className="sm:hidden">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Aperçu rapide
          </h3>
          
          <div className="space-y-2">
            {balances.map((balance) => {
              const BalanceIcon = getBalanceIcon(balance.balance);
              const memberColor = getMemberColor(balance.memberId);
              
              return (
                <div
                  key={`mobile-${balance.memberId}`}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: memberColor }}
                    />
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {balance.memberName}
                    </span>
                  </div>
                  
                  <div className={`flex items-center gap-1 ${getBalanceColor(balance.balance)}`}>
                    <BalanceIcon className="w-4 h-4" />
                    <span className="font-semibold text-sm">
                      {formatCurrency(Math.abs(balance.balance))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Enhanced Settlements with readable descriptions */}
      {transactions.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Remboursements optimisés
          </h3>
          
          <div className="space-y-4">
            {transactions.map((transaction, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800 gap-4"
              >
                <div className="flex-1">
                  {/* Human-readable description */}
                  <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {ExpenseCalculator.formatTransactionDescription(transaction)}
                  </div>
                  
                  {/* Visual representation */}
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <img
                        src={getMemberAvatar(transaction.from)}
                        alt={transaction.fromName}
                        className="w-6 h-6 rounded-full border"
                        style={{ borderColor: getMemberColor(transaction.from) }}
                      />
                      <span className="font-medium">{transaction.fromName}</span>
                    </div>
                    
                    <ArrowRight className="w-4 h-4 text-blue-500" />
                    
                    <div className="flex items-center gap-2">
                      <img
                        src={getMemberAvatar(transaction.to)}
                        alt={transaction.toName}
                        className="w-6 h-6 rounded-full border"
                        style={{ borderColor: getMemberColor(transaction.to) }}
                      />
                      <span className="font-medium">{transaction.toName}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => onSettleDebt(transaction)}
                  className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                >
                  <CheckCircle className="w-4 h-4" />
                  Marquer comme payé
                </Button>
              </div>
            ))}
          </div>
          
          {/* Summary for multiple transactions */}
          {transactions.length > 1 && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                <strong>{transactions.length} transactions</strong> au lieu de potentiellement plus avec un algorithme simple.
                <br />
                <span className="text-xs">
                  L'algorithme a optimisé les remboursements pour minimiser le nombre de transactions.
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800 p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
            Tous les comptes sont équilibrés !
          </h3>
          <p className="text-green-700 dark:text-green-300">
            Aucun remboursement nécessaire pour le moment.
          </p>
        </div>
      )}
    </div>
  );
}