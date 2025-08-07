import React, { useState } from 'react';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { CategorySelector } from '../UI/CategorySelector';
import { CurrencySelector } from '../UI/CurrencySelector';
import { Group, Expense, Member } from '../../types';
import { Check, Camera, Paperclip } from 'lucide-react';
import { CurrencyService } from '../../utils/currencies';

interface ExpenseFormProps {
  group: Group;
  expense?: Expense;
  onSubmit: (expense: Expense) => void;
  onCancel: () => void;
}

export function ExpenseForm({ group, expense, onSubmit, onCancel }: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    description: expense?.description || '',
    amount: expense?.amount?.toString() || '',
    currency: expense?.currency || group.currency || 'EUR',
    paidBy: expense?.paidBy || group.members[0]?.id || '',
    date: expense?.date.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    category: expense?.category || 'other'
  });
  
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    expense?.splitBetween.map(s => s.memberId) || group.members.map(m => m.id)
  );
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(
    expense?.splitBetween.reduce((acc, split) => {
      if (split.amount) {
        acc[split.memberId] = split.amount.toString();
      }
      return acc;
    }, {} as Record<string, string>) || {}
  );
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const currencyService = CurrencyService.getInstance();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev => {
      const updated = prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId];
      return updated;
    });
  };

  const handleCustomAmountChange = (memberId: string, amount: string) => {
    setCustomAmounts(prev => ({ ...prev, [memberId]: amount }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'La description est obligatoire';
    }
    
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Le montant doit être positif';
    }
    
    if (!formData.paidBy) {
      newErrors.paidBy = 'Sélectionnez qui a payé';
    }
    
    if (selectedMembers.length === 0) {
      newErrors.members = 'Sélectionnez au moins un bénéficiaire';
    }
    
    if (splitType === 'custom') {
      const totalCustom = selectedMembers.reduce((sum, memberId) => {
        const customAmount = parseFloat(customAmounts[memberId] || '0');
        return sum + customAmount;
      }, 0);
      
      if (Math.abs(totalCustom - amount) > 0.01) {
        newErrors.custom = 'La somme des montants personnalisés doit égaler le montant total';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const amount = parseFloat(formData.amount);
      const splitBetween = selectedMembers.map(memberId => ({
        memberId,
        amount: splitType === 'custom' ? parseFloat(customAmounts[memberId] || '0') : undefined
      }));
      
      const newExpense: Expense = {
        id: expense?.id || Date.now().toString(),
        groupId: group.id,
        description: formData.description.trim(),
        amount,
        currency: formData.currency,
        paidBy: formData.paidBy,
        splitBetween,
        date: new Date(formData.date),
        category: formData.category,
        createdAt: expense?.createdAt || new Date()
      };
      
      onSubmit(newExpense);
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = parseFloat(formData.amount) || 0;
  const equalAmount = selectedMembers.length > 0 ? totalAmount / selectedMembers.length : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Input
            label="Description *"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Restaurant, Essence, Courses..."
            error={errors.description}
          />
          
          <Input
            label="Montant *"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="0.00"
            error={errors.amount}
          />
          
          <CurrencySelector
            label="Devise"
            value={formData.currency}
            onChange={(currency) => setFormData(prev => ({ ...prev, currency }))}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payé par *
            </label>
            <select
              name="paidBy"
              value={formData.paidBy}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {group.members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            {errors.paidBy && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.paidBy}</p>
            )}
          </div>
          
          <Input
            label="Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleInputChange}
          />
          
          <CategorySelector
            label="Catégorie"
            value={formData.category}
            onChange={(category) => setFormData(prev => ({ ...prev, category }))}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pièces jointes
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
              >
                <Camera className="w-4 h-4" />
                Photo
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
              >
                <Paperclip className="w-4 h-4" />
                Fichier
              </button>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Répartition *
            </label>
            
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setSplitType('equal')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  splitType === 'equal'
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Partage égal
              </button>
              <button
                type="button"
                onClick={() => setSplitType('custom')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  splitType === 'custom'
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Personnalisé
              </button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {group.members.map(member => {
                const isSelected = selectedMembers.includes(member.id);
                const customAmount = customAmounts[member.id] || '';
                
                return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/10'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleMemberToggle(member.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </button>
                    
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-8 h-8 rounded-full"
                    />
                    
                    <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                      {member.name}
                    </span>
                    
                    {isSelected && (
                      <div className="flex items-center gap-2">
                        {splitType === 'equal' ? (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {currencyService.formatCurrency(equalAmount, formData.currency)}
                          </span>
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={customAmount}
                            onChange={(e) => handleCustomAmountChange(member.id, e.target.value)}
                            placeholder="0.00"
                            className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {errors.members && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">{errors.members}</p>
            )}
            {errors.custom && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">{errors.custom}</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={loading}>
          {expense ? 'Modifier' : 'Ajouter'} la dépense
        </Button>
      </div>
    </form>
  );
}