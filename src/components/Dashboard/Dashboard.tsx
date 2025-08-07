import React, { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Group } from '../../types';
import { Button } from '../UI/Button';
import { SearchInput } from '../UI/SearchInput';
import { GroupCard } from '../Groups/GroupCard';
import { CurrencyService } from '../../utils/currencies';

interface DashboardProps {
  groups: Group[];
  onSelectGroup: (group: Group) => void;
  onCreateGroup: () => void;
}

export function Dashboard({ groups, onSelectGroup, onCreateGroup }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'activity' | 'amount'>('activity');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');

  const currencyService = CurrencyService.getInstance();

  const filteredAndSortedGroups = groups
    .filter(group => {
      const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCurrency = filterCurrency === 'all' || group.currency === filterCurrency;
      
      return matchesSearch && matchesCurrency;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'activity':
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
        case 'amount':
          const totalA = a.expenses.reduce((sum, exp) => sum + exp.amount, 0);
          const totalB = b.expenses.reduce((sum, exp) => sum + exp.amount, 0);
          return totalB - totalA;
        default:
          return 0;
      }
    });

  const uniqueCurrencies = [...new Set(groups.map(g => g.currency))];

  if (groups.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Plus className="w-12 h-12 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Bienvenue sur SplitEase !
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Commencez par créer votre premier groupe pour gérer vos dépenses partagées
          en toute simplicité. Que ce soit pour un voyage, une colocation ou une sortie
          entre amis, SplitEase vous aide à équilibrer les comptes.
        </p>
        <Button onClick={onCreateGroup} size="lg">
          <Plus className="w-5 h-5" />
          Créer mon premier groupe
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mes groupes
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez vos dépenses partagées avec vos amis et votre famille
          </p>
        </div>
        <Button onClick={onCreateGroup}>
          <Plus className="w-4 h-4" />
          Nouveau groupe
        </Button>
      </div>

      {groups.length > 3 && (
        <div className="relative">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Rechercher un groupe..."
          />
        </div>
      )}

      {groups.length > 1 && (
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="activity">Activité récente</option>
              <option value="name">Nom A-Z</option>
              <option value="amount">Montant total</option>
            </select>
          </div>
          
          {uniqueCurrencies.length > 1 && (
            <select
              value={filterCurrency}
              onChange={(e) => setFilterCurrency(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">Toutes devises</option>
              {uniqueCurrencies.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedGroups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            onClick={() => onSelectGroup(group)}
          />
        ))}
      </div>

      {filteredAndSortedGroups.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun groupe trouvé
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Essayez avec d'autres mots-clés ou créez un nouveau groupe.
          </p>
        </div>
      )}
    </div>
  );
}