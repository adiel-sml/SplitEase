import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SUPPORTED_CURRENCIES, Currency } from '../../utils/currencies';

interface CurrencySelectorProps {
  value: string;
  onChange: (currencyCode: string) => void;
  label?: string;
  error?: string;
  compact?: boolean;
}

export function CurrencySelector({ value, onChange, label, error, compact = false }: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedCurrency = SUPPORTED_CURRENCIES.find(c => c.code === value);

  const handleSelect = (currency: Currency) => {
    onChange(currency.code);
    setIsOpen(false);
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-1"
        >
          <span>{selectedCurrency?.flag}</span>
          <span>{selectedCurrency?.code}</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {isOpen && (
          <div className="absolute z-10 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto min-w-[200px]">
            {SUPPORTED_CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                type="button"
                onClick={() => handleSelect(currency)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 text-sm ${
                  value === currency.code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                }`}
              >
                <span>{currency.flag}</span>
                <span className="font-medium">{currency.code}</span>
                <span className="text-gray-500 dark:text-gray-400">{currency.symbol}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

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
            {selectedCurrency ? (
              <>
                <span className="text-lg">{selectedCurrency.flag}</span>
                <span className="text-gray-900 dark:text-white">{selectedCurrency.name}</span>
                <span className="text-gray-500 dark:text-gray-400">({selectedCurrency.code})</span>
              </>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">Sélectionner une devise</span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {SUPPORTED_CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                type="button"
                onClick={() => handleSelect(currency)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 ${
                  value === currency.code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                }`}
              >
                <span className="text-lg">{currency.flag}</span>
                <div className="flex-1">
                  <div className="font-medium">{currency.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{currency.code} • {currency.symbol}</div>
                </div>
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