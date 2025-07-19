import React, { useState } from 'react';
import { Plus, Share, Download, ArrowLeft, Users, Calculator } from 'lucide-react';
import { Group, Expense, Transaction } from '../../types';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';
import { ToastContainer } from '../UI/ToastContainer';
import { ExpenseForm } from '../Expenses/ExpenseForm';
import { ExpenseList } from '../Expenses/ExpenseList';
import { BalancesSummary } from '../Balances/BalancesSummary';
import { DataService } from '../../services/DataService';
import { ExpenseCalculator } from '../../utils/calculations';
import { useToast } from '../../hooks/useToast';

interface GroupViewProps {
  group: Group;
  onBack: () => void;
  onUpdateGroup: (group: Group) => void;
}

export function GroupView({ group, onBack, onUpdateGroup }: GroupViewProps) {
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances'>('expenses');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [showShareModal, setShowShareModal] = useState(false);
  
  const dataService = DataService.getInstance();
  const { toasts, addToast } = useToast();

  const totalExpenses = ExpenseCalculator.getTotalExpenses(group);

  const handleAddExpense = async (expense: Expense) => {
    try {
      const updatedGroup = {
        ...group,
        expenses: editingExpense
          ? group.expenses.map(e => e.id === expense.id ? expense : e)
          : [...group.expenses, expense],
        lastActivity: new Date()
      };
      
      await dataService.saveGroup(updatedGroup);
      onUpdateGroup(updatedGroup);
      setShowExpenseForm(false);
      setEditingExpense(undefined);
      
      // Show success toast
      addToast({
        type: 'success',
        title: editingExpense ? 'Dépense modifiée' : 'Dépense ajoutée',
        message: editingExpense 
          ? `La dépense "${expense.description}" a été mise à jour avec succès.`
          : `La dépense "${expense.description}" de ${expense.amount.toFixed(2)}€ a été ajoutée au groupe.`,
        duration: 4000
      });
    } catch (error) {
      console.error('Error saving expense:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de sauvegarder la dépense. Veuillez réessayer.',
        duration: 5000
      });
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const expense = group.expenses.find(e => e.id === expenseId);
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la dépense "${expense?.description}" ?`)) return;
    
    try {
      const updatedGroup = {
        ...group,
        expenses: group.expenses.filter(e => e.id !== expenseId),
        lastActivity: new Date()
      };
      
      await dataService.saveGroup(updatedGroup);
      onUpdateGroup(updatedGroup);
      
      addToast({
        type: 'success',
        title: 'Dépense supprimée',
        message: `La dépense "${expense?.description}" a été supprimée du groupe.`,
        duration: 3000
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de supprimer la dépense. Veuillez réessayer.',
        duration: 5000
      });
    }
  };

  const handleSettleDebt = async (transaction: Transaction) => {
    const formattedDescription = ExpenseCalculator.formatTransactionDescription(transaction);
    if (!confirm(`Confirmer ce remboursement ?\n\n${formattedDescription}`)) {
      return;
    }
    
    // For now, we'll just show a success message
    // In a real app, this would be tracked in settlements
    addToast({
      type: 'success',
      title: 'Remboursement confirmé',
      message: formattedDescription,
      duration: 4000
    });
  };

  const handleExport = async () => {
    try {
      const csvData = await dataService.exportGroupData(group.id);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${group.name}-expenses.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      addToast({
        type: 'success',
        title: 'Export réussi',
        message: `Les données du groupe "${group.name}" ont été exportées en CSV.`,
        duration: 3000
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      addToast({
        type: 'error',
        title: 'Erreur d\'export',
        message: 'Impossible d\'exporter les données. Veuillez réessayer.',
        duration: 5000
      });
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/group/${group.id}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        addToast({
          type: 'success',
          title: 'Lien copié',
          message: 'Le lien de partage a été copié dans le presse-papiers.',
          duration: 3000
        });
      }).catch(() => {
        addToast({
          type: 'error',
          title: 'Erreur de copie',
          message: 'Impossible de copier le lien. Copiez-le manuellement depuis la fenêtre de partage.',
          duration: 5000
        });
      });
    } else {
      addToast({
        type: 'info',
        title: 'Copie manuelle',
        message: 'Copiez le lien depuis la fenêtre de partage qui va s\'ouvrir.',
        duration: 4000
      });
    }
    
    setShowShareModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto relative">
      <ToastContainer toasts={toasts} />
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          
          {group.image && (
            <img
              src={group.image}
              alt={group.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {group.name}
            </h1>
            {group.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {group.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {group.members.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Membres</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {group.expenses.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Dépenses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(totalExpenses)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalExpenses / group.members.length)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Par personne</div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setShowExpenseForm(true)}>
            <Plus className="w-4 h-4" />
            Nouvelle dépense
          </Button>
          <Button variant="outline" onClick={() => setShowShareModal(true)}>
            <Share className="w-4 h-4" />
            Partager
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'expenses'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Dépenses
            </button>
            <button
              onClick={() => setActiveTab('balances')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'balances'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Calculator className="w-4 h-4 inline mr-2" />
              Soldes
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'expenses' ? (
            <ExpenseList
              group={group}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          ) : (
            <BalancesSummary
              group={group}
              onSettleDebt={handleSettleDebt}
            />
          )}
        </div>
      </div>

      {/* Expense Form Modal */}
      <Modal
        isOpen={showExpenseForm}
        onClose={() => {
          setShowExpenseForm(false);
          setEditingExpense(undefined);
        }}
        title={editingExpense ? 'Modifier la dépense' : 'Nouvelle dépense'}
        size="lg"
      >
        <ExpenseForm
          group={group}
          expense={editingExpense}
          onSubmit={handleAddExpense}
          onCancel={() => {
            setShowExpenseForm(false);
            setEditingExpense(undefined);
          }}
        />
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Partager le groupe"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lien de partage
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/group/${group.id}`}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <Button onClick={handleShare}>
                Copier
              </Button>
            </div>
          </div>
          
          <div className="text-center">
            <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg mx-auto flex items-center justify-center">
              <span className="text-gray-500">QR Code</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Scannez ce QR code pour rejoindre le groupe
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}