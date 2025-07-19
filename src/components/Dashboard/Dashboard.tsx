import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Group } from '../../types';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { GroupCard } from '../Groups/GroupCard';

interface DashboardProps {
  groups: Group[];
  onSelectGroup: (group: Group) => void;
  onCreateGroup: () => void;
}

export function Dashboard({ groups, onSelectGroup, onCreateGroup }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Rechercher un groupe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            onClick={() => onSelectGroup(group)}
          />
        ))}
      </div>

      {filteredGroups.length === 0 && searchTerm && (
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