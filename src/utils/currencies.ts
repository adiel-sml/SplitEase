export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' }
];

export class CurrencyService {
  private static instance: CurrencyService;
  private exchangeRates: Record<string, number> = { EUR: 1 };
  private lastUpdate: Date | null = null;
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 heure

  static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  async getExchangeRates(): Promise<Record<string, number>> {
    const now = new Date();
    
    // Utiliser le cache si disponible et récent
    if (this.lastUpdate && (now.getTime() - this.lastUpdate.getTime()) < this.CACHE_DURATION) {
      return this.exchangeRates;
    }

    try {
      // API gratuite pour les taux de change (fallback sur des taux fixes si échec)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
      
      if (response.ok) {
        const data = await response.json();
        this.exchangeRates = { EUR: 1, ...data.rates };
        this.lastUpdate = now;
      } else {
        // Taux de change fixes en cas d'échec de l'API
        this.exchangeRates = {
          EUR: 1,
          USD: 1.08,
          GBP: 0.86,
          CHF: 0.96,
          CAD: 1.48,
          JPY: 161.50,
          AUD: 1.66,
          SEK: 11.45,
          NOK: 11.85,
          DKK: 7.46
        };
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération des taux de change:', error);
      // Utiliser les taux par défaut
    }

    return this.exchangeRates;
  }

  async convertAmount(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return amount;
    
    const rates = await this.getExchangeRates();
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;
    
    // Convertir vers EUR puis vers la devise cible
    const eurAmount = amount / fromRate;
    return eurAmount * toRate;
  }

  formatCurrency(amount: number, currencyCode: string, locale: string = 'fr-FR'): string {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback si la devise n'est pas supportée par Intl
      return `${currency?.symbol || currencyCode} ${amount.toFixed(2)}`;
    }
  }

  getCurrencyInfo(code: string): Currency | undefined {
    return SUPPORTED_CURRENCIES.find(c => c.code === code);
  }
}