// Currency configuration and utility functions
export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
  locale?: string;
}

// Comprehensive currency definitions
export const CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2, locale: 'en-US' },
  PHP: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', decimals: 2, locale: 'en-PH' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2, locale: 'en-EU' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2, locale: 'en-GB' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2, locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2, locale: 'en-AU' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0, locale: 'ja-JP' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimals: 2, locale: 'zh-CN' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2, locale: 'en-IN' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2, locale: 'en-SG' },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', decimals: 2, locale: 'ms-MY' },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', decimals: 2, locale: 'th-TH' },
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', decimals: 0, locale: 'id-ID' },
  VND: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', decimals: 0, locale: 'vi-VN' },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', decimals: 0, locale: 'ko-KR' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimals: 2, locale: 'pt-BR' },
  MXN: { code: 'MXN', symbol: '$', name: 'Mexican Peso', decimals: 2, locale: 'es-MX' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', decimals: 2, locale: 'en-ZA' },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', decimals: 2, locale: 'tr-TR' },
  RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble', decimals: 2, locale: 'ru-RU' }
};

// Force refresh currency cache from database
export async function refreshCurrencyCache(): Promise<void> {
  try {
    const { db } = await import('./database');
    const currencyConfig = await db.systemConfigs
      .where('key')
      .equals('currency_code')
      .first();
    
    if (currencyConfig && currencyConfig.value && CURRENCIES[currencyConfig.value]) {
      localStorage.setItem('pos-cached-currency', currencyConfig.value);
      
      // Also trigger a page refresh event to update all components
      window.dispatchEvent(new CustomEvent('currencyChanged', { 
        detail: { currencyCode: currencyConfig.value } 
      }));
    }
  } catch (error) {
    console.error('Error refreshing currency cache:', error);
  }
}

// Get current currency from settings
export async function getCurrentCurrency(): Promise<CurrencyConfig> {
  try {
    // Try to get from database first (most authoritative)
    const { db } = await import('./database');
    const currencyConfig = await db.systemConfigs
      .where('key')
      .equals('currency_code')
      .first();
    
    if (currencyConfig && currencyConfig.value && CURRENCIES[currencyConfig.value]) {
      // Cache the currency setting for sync access
      localStorage.setItem('pos-cached-currency', currencyConfig.value);
      return CURRENCIES[currencyConfig.value];
    }

    // Fallback to localStorage
    const savedSettings = localStorage.getItem('pos-system-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.currency && CURRENCIES[settings.currency]) {
        // Cache this setting as well
        localStorage.setItem('pos-cached-currency', settings.currency);
        return CURRENCIES[settings.currency];
      }
    }
    
    // Final fallback to USD
    localStorage.setItem('pos-cached-currency', 'USD');
    return CURRENCIES.USD;
  } catch (error) {
    console.error('Error getting current currency:', error);
    // Emergency fallback to localStorage only
    try {
      const savedSettings = localStorage.getItem('pos-system-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.currency && CURRENCIES[settings.currency]) {
          localStorage.setItem('pos-cached-currency', settings.currency);
          return CURRENCIES[settings.currency];
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    localStorage.setItem('pos-cached-currency', 'USD');
    return CURRENCIES.USD;
  }
}

// Synchronous version for compatibility - now checks database cache
export function getCurrentCurrencySync(): CurrencyConfig {
  try {
    // Check if we have a cached database currency setting
    const cachedCurrency = localStorage.getItem('pos-cached-currency');
    if (cachedCurrency) {
      const currencyCode = cachedCurrency;
      if (CURRENCIES[currencyCode]) {
        return CURRENCIES[currencyCode];
      }
    }
    
    // Try localStorage settings as fallback
    const savedSettings = localStorage.getItem('pos-system-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.currency && CURRENCIES[settings.currency]) {
        return CURRENCIES[settings.currency];
      }
    }
    
    // Fallback to USD
    return CURRENCIES.USD;
  } catch (error) {
    console.error('Error getting current currency sync:', error);
    return CURRENCIES.USD;
  }
}

// Format currency with proper localization
export function formatCurrency(
  amount: number, 
  currencyCode?: string, 
  options: Partial<Intl.NumberFormatOptions> = {}
): string {
  const currency = currencyCode ? CURRENCIES[currencyCode] : getCurrentCurrencySync();
  
  if (!currency) {
    // Fallback formatting
    return `$${amount.toFixed(2)}`;
  }

  try {
    // Use Intl.NumberFormat for proper localization
    const formatter = new Intl.NumberFormat(currency.locale || 'en-US', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
      ...options
    });

    return formatter.format(amount);
  } catch (error) {
    // Fallback to symbol + number if Intl fails
    console.warn('Currency formatting failed, using fallback:', error);
    return `${currency.symbol}${amount.toFixed(currency.decimals)}`;
  }
}

// Format currency without symbol (numbers only)
export function formatCurrencyNumber(amount: number, currencyCode?: string): string {
  const currency = currencyCode ? CURRENCIES[currencyCode] : getCurrentCurrencySync();
  
  if (!currency) {
    return amount.toFixed(2);
  }

  try {
    const formatter = new Intl.NumberFormat(currency.locale || 'en-US', {
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals
    });

    return formatter.format(amount);
  } catch {
    return amount.toFixed(currency.decimals);
  }
}

// Get currency symbol
export function getCurrencySymbol(currencyCode?: string): string {
  const currency = currencyCode ? CURRENCIES[currencyCode] : getCurrentCurrencySync();
  return currency?.symbol || '$';
}

// Get all available currencies as an array
export function getAvailableCurrencies(): CurrencyConfig[] {
  return Object.values(CURRENCIES);
}

// Parse currency string back to number
export function parseCurrencyString(currencyString: string): number {
  // Remove all non-numeric characters except decimal point and minus sign
  const numericString = currencyString.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(numericString);
  return isNaN(parsed) ? 0 : parsed;
}

// Validate currency code
export function isValidCurrencyCode(code: string): boolean {
  return code in CURRENCIES;
}

// Convert between currencies (would need exchange rates in real app)
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  // This is a placeholder - in a real app you'd use current exchange rates
  // For now, just return the same amount
  console.log(`Currency conversion: ${amount} ${fromCurrency} → ${toCurrency}`);
  return amount;
}

// Format for display in tables/lists (shorter format)
export function formatCurrencyCompact(amount: number, currencyCode?: string): string {
  const currency = currencyCode ? CURRENCIES[currencyCode] : getCurrentCurrencySync();
  
  if (!currency) {
    return `$${amount.toFixed(2)}`;
  }

  // For large numbers, use compact notation
  if (Math.abs(amount) >= 1000000) {
    return `${currency.symbol}${(amount / 1000000).toFixed(1)}M`;
  } else if (Math.abs(amount) >= 1000) {
    return `${currency.symbol}${(amount / 1000).toFixed(1)}K`;
  }

  return formatCurrency(amount, currencyCode);
}
