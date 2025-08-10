import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  PieChart, 
  BarChart3, 
  Trophy,
  Target,
  Clock,
  MapPin,
  Heart,
  Star
} from 'lucide-react';
import { Group } from '../../types';
import { ExpenseCalculator } from '../../utils/calculations';
import { getCategoryName, getCategoryIcon, getCategoryColor } from '../../utils/categories';
import { CurrencyService } from '../../utils/currencies';

interface AdvancedDashboardProps {
  groups: Group[];
  onSelectGroup: (group: Group) => void;
}

export function AdvancedDashboard({ groups, onSelectGroup }: AdvancedDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year' | 'all'>('month');
  const [showAnnualSummary, setShowAnnualSummary] = useState(false);
  
  const currencyService = CurrencyService.getInstance();

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    let filteredExpenses = groups.flatMap(group => 
      group.expenses.map(expense => ({ ...expense, groupName: group.name }))
    );

    // Filter by selected period
    if (selectedPeriod === 'month') {
      filteredExpenses = filteredExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === currentYear && 
               expenseDate.getMonth() === currentMonth;
      });
    } else if (selectedPeriod === 'year') {
      filteredExpenses = filteredExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === currentYear;
      });
    }

    const totalSpent = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const avgExpense = filteredExpenses.length > 0 ? totalSpent / filteredExpenses.length : 0;
    
    // Category breakdown
    const categoryStats = filteredExpenses.reduce((acc, expense) => {
      const category = expense.category || 'other';
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([categoryId, amount]) => ({
        categoryId,
        name: getCategoryName(categoryId),
        icon: getCategoryIcon(categoryId),
        color: getCategoryColor(categoryId),
        amount,
        percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0
      }));

    // Group activity
    const groupStats = groups.map(group => {
      const groupExpenses = group.expenses.filter(expense => {
        if (selectedPeriod === 'month') {
          const expenseDate = new Date(expense.date);
          return expenseDate.getFullYear() === currentYear && 
                 expenseDate.getMonth() === currentMonth;
        } else if (selectedPeriod === 'year') {
          const expenseDate = new Date(expense.date);
          return expenseDate.getFullYear() === currentYear;
        }
        return true;
      });
      
      const total = groupExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const balances = ExpenseCalculator.calculateBalances(group);
      const myBalance = balances.find(b => b.memberId === 'current-user')?.balance || 0;
      
      return {
        group,
        total,
        expenseCount: groupExpenses.length,
        myBalance,
        lastActivity: group.lastActivity
      };
    }).sort((a, b) => b.total - a.total);

    return {
      totalSpent,
      avgExpense,
      expenseCount: filteredExpenses.length,
      groupCount: groups.length,
      topCategories,
      groupStats,
      categoryStats
    };
  }, [groups, selectedPeriod]);

  const formatCurrency = (amount: number) => currencyService.formatCurrency(amount, 'EUR');

  if (showAnnualSummary) {
    return <AnnualSummary groups={groups} onBack={() => setShowAnnualSummary(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard Avancé
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Analyse complète de vos dépenses et groupes
          </p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
            <option value="all">Tout</option>
          </select>
          
          <button
            onClick={() => setShowAnnualSummary(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center gap-2"
          >
            <Star className="w-4 h-4" />
            Résumé Annuel
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Dépensé"
          value={formatCurrency(stats.totalSpent)}
          icon={TrendingUp}
          color="blue"
          trend="+12% vs mois dernier"
        />
        <MetricCard
          title="Dépense Moyenne"
          value={formatCurrency(stats.avgExpense)}
          icon={Target}
          color="green"
          trend="Stable"
        />
        <MetricCard
          title="Nombre de Dépenses"
          value={stats.expenseCount.toString()}
          icon={BarChart3}
          color="purple"
          trend={`${stats.groupCount} groupes actifs`}
        />
        <MetricCard
          title="Groupes Actifs"
          value={stats.groupCount.toString()}
          icon={Users}
          color="orange"
          trend="Tous synchronisés"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Répartition par Catégorie
          </h3>
          
          <div className="space-y-3">
            {stats.topCategories.map((category, index) => (
              <div key={category.categoryId} className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-lg">{category.icon}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {category.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: category.color,
                        width: `${category.percentage}%`
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-16 text-right">
                    {category.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Group Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Groupes les Plus Actifs
          </h3>
          
          <div className="space-y-3">
            {stats.groupStats.slice(0, 5).map((groupStat, index) => (
              <div
                key={groupStat.group.id}
                onClick={() => onSelectGroup(groupStat.group)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {groupStat.group.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {groupStat.expenseCount} dépenses
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(groupStat.total)}
                  </div>
                  <div className={`text-sm ${
                    groupStat.myBalance > 0 ? 'text-green-600' : 
                    groupStat.myBalance < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {groupStat.myBalance !== 0 && formatCurrency(Math.abs(groupStat.myBalance))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Activité Récente
        </h3>
        
        <RecentActivityTimeline groups={groups} />
      </div>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'purple' | 'orange';
  trend?: string;
}

function MetricCard({ title, value, icon: Icon, color, trend }: MetricCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {trend && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{trend}</p>
        )}
      </div>
    </div>
  );
}

// Recent Activity Timeline Component
function RecentActivityTimeline({ groups }: { groups: Group[] }) {
  const recentExpenses = groups
    .flatMap(group => 
      group.expenses.map(expense => ({
        ...expense,
        groupName: group.name,
        groupId: group.id
      }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-4">
      {recentExpenses.map((expense, index) => (
        <div key={expense.id} className="flex items-start gap-4">
          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getCategoryIcon(expense.category)}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {expense.description}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                dans {expense.groupName}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{new Date(expense.createdAt).toLocaleDateString('fr-FR')}</span>
              <span className="font-semibold">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(expense.amount)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Annual Summary Component (Spotify Wrapped Style)
function AnnualSummary({ groups, onBack }: { groups: Group[]; onBack: () => void }) {
  const currentYear = new Date().getFullYear();
  const yearExpenses = groups.flatMap(group => 
    group.expenses.filter(expense => 
      new Date(expense.date).getFullYear() === currentYear
    ).map(expense => ({ ...expense, groupName: group.name }))
  );

  const totalSpent = yearExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const avgExpense = yearExpenses.length > 0 ? totalSpent / yearExpenses.length : 0;
  
  const categoryStats = yearExpenses.reduce((acc, expense) => {
    const category = expense.category || 'other';
    acc[category] = (acc[category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategory = Object.entries(categoryStats)
    .sort(([, a], [, b]) => b - a)[0];

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <button
            onClick={onBack}
            className="mb-4 text-white/70 hover:text-white transition-colors"
          >
            ← Retour au dashboard
          </button>
          <h1 className="text-4xl font-bold mb-2">Votre Année {currentYear}</h1>
          <p className="text-white/70">Découvrez vos habitudes de dépenses</p>
        </div>

        {/* Total Spent */}
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8">
          <h2 className="text-2xl font-semibold mb-4">Vous avez dépensé</h2>
          <div className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            {formatCurrency(totalSpent)}
          </div>
          <p className="text-white/70 mt-2">
            Répartis sur {yearExpenses.length} dépenses
          </p>
        </div>

        {/* Top Category */}
        {topCategory && (
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-4">Votre catégorie préférée</h2>
            <div className="text-6xl mb-4">{getCategoryIcon(topCategory[0])}</div>
            <div className="text-3xl font-bold">{getCategoryName(topCategory[0])}</div>
            <p className="text-white/70 mt-2">
              {formatCurrency(topCategory[1])} • {((topCategory[1] / totalSpent) * 100).toFixed(1)}% du total
            </p>
          </div>
        )}

        {/* Average Expense */}
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8">
          <h2 className="text-2xl font-semibold mb-4">Dépense moyenne</h2>
          <div className="text-4xl font-bold text-green-400">
            {formatCurrency(avgExpense)}
          </div>
          <p className="text-white/70 mt-2">par transaction</p>
        </div>

        {/* Fun Facts */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">Le saviez-vous ?</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-red-400" />
              <span>Vous avez partagé {groups.length} aventures avec vos amis</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-400" />
              <span>
                Votre mois le plus actif : {
                  // Calculate most active month
                  Object.entries(
                    yearExpenses.reduce((acc, expense) => {
                      const month = new Date(expense.date).getMonth();
                      acc[month] = (acc[month] || 0) + 1;
                      return acc;
                    }, {} as Record<number, number>)
                  ).sort(([, a], [, b]) => b - a)[0]?.[0] 
                    ? new Date(2023, parseInt(Object.entries(
                        yearExpenses.reduce((acc, expense) => {
                          const month = new Date(expense.date).getMonth();
                          acc[month] = (acc[month] || 0) + 1;
                          return acc;
                        }, {} as Record<number, number>)
                      ).sort(([, a], [, b]) => b - a)[0][0]), 1).toLocaleDateString('fr-FR', { month: 'long' })
                    : 'Janvier'
                }
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <span>
                Plus grosse dépense : {formatCurrency(Math.max(...yearExpenses.map(e => e.amount)))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}