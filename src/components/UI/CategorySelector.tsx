import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { EXPENSE_CATEGORIES, getCategoryById } from '../../utils/categories';

interface CategorySelectorProps {
  value?: string;
  onChange: (categoryId: string) => void;
  label?: string;
  error?: string;
}

export function CategorySelector({ value, onChange, label, error }: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedCategory = value ? getCategoryById(value) : null;

  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
    setIsOpen(false);
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-left flex items-center justify-between ${
            error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          <div className="flex items-center gap-2">
            {selectedCategory ? (
              <>
                <span className="text-lg">{selectedCategory.icon}</span>
                <span className="text-gray-900 dark:text-white">{selectedCategory.name}</span>
              </>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">Sélectionner une catégorie</span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {EXPENSE_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleSelect(category.id)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 ${
                  value === category.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                }`}
              >
                <span className="text-lg">{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}