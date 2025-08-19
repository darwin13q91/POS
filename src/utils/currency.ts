// Currency formatting utilities for the POS system

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  decimals: number;
}

export const currencyConfigs: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', decimals: 2 },
  PHP: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', locale: 'en-PH', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'en-EU', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', decimals: 2 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA', decimals: 2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', decimals: 0 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN', decimals: 2 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', decimals: 2 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', decimals: 2 },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', locale: 'ms-MY', decimals: 2 },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', locale: 'th-TH', decimals: 2 },
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', locale: 'id-ID', decimals: 0 },
  VND: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', locale: 'vi-VN', decimals: 0 },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR', decimals: 0 },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR', decimals: 2 },
  MXN: { code: 'MXN', symbol: '$', name: 'Mexican Peso', locale: 'es-MX', decimals: 2 },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA', decimals: 2 },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', locale: 'tr-TR', decimals: 2 },
  RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble', locale: 'ru-RU', decimals: 2 }
};

/**
 * Get the current currency setting from localStorage
 */
export const getCurrentCurrency = (): string => {
  try {
    const settings = localStorage.getItem('pos-system-settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      return parsed.currency || 'USD';
    }
  } catch (error) {
    console.error('Error getting currency setting:', error);
  }
  return 'USD'; // Default fallback
};

/**
 * Get currency configuration for the current or specified currency
 */
export const getCurrencyConfig = (currencyCode?: string): CurrencyConfig => {
  const code = currencyCode || getCurrentCurrency();
  return currencyConfigs[code] || currencyConfigs.USD;
};

/**
 * Format a number as currency using the current currency setting
 */
export const formatCurrency = (amount: number, currencyCode?: string): string => {
  const config = getCurrencyConfig(currencyCode);
  
  try {
    // Use Intl.NumberFormat for proper localization
    const formatter = new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals
    });
    
    return formatter.format(amount);
  } catch (error) {
    // Fallback to manual formatting if Intl fails
    console.warn('Intl.NumberFormat failed, using fallback:', error);
    const fixedAmount = amount.toFixed(config.decimals);
    return `${config.symbol}${fixedAmount}`;
  }
};

/**
 * Format currency with just the symbol (for compact display)
 */
export const formatCurrencyCompact = (amount: number, currencyCode?: string): string => {
  const config = getCurrencyConfig(currencyCode);
  const fixedAmount = amount.toFixed(config.decimals);
  return `${config.symbol}${fixedAmount}`;
};

/**
 * Get just the currency symbol
 */
export const getCurrencySymbol = (currencyCode?: string): string => {
  const config = getCurrencyConfig(currencyCode);
  return config.symbol;
};

/**
 * Parse a currency string back to a number
 */
export const parseCurrency = (currencyString: string, currencyCode?: string): number => {
  const config = getCurrencyConfig(currencyCode);
  
  // Remove currency symbol and non-numeric characters except decimal point
  const cleaned = currencyString
    .replace(config.symbol, '')
    .replace(/[^\d.-]/g, '');
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Validate if a currency code is supported
 */
export const isSupportedCurrency = (currencyCode: string): boolean => {
  return currencyCode in currencyConfigs;
};

/**
 * Get all supported currency codes
 */
export const getSupportedCurrencies = (): string[] => {
  return Object.keys(currencyConfigs);
};

/**
 * Get currency display name
 */
export const getCurrencyName = (currencyCode?: string): string => {
  const config = getCurrencyConfig(currencyCode);
  return config.name;
};

/**
 * Format percentage values
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Calculate tax amount based on currency
 */
export const calculateTax = (subtotal: number, taxRate: number, currencyCode?: string): number => {
  const config = getCurrencyConfig(currencyCode);
  const taxAmount = (subtotal * taxRate) / 100;
  
  // Round to appropriate decimal places for currency
  return Math.round(taxAmount * Math.pow(10, config.decimals)) / Math.pow(10, config.decimals);
};

/**
 * Round amount to currency-appropriate precision
 */
export const roundToCurrency = (amount: number, currencyCode?: string): number => {
  const config = getCurrencyConfig(currencyCode);
  return Math.round(amount * Math.pow(10, config.decimals)) / Math.pow(10, config.decimals);
};

/**
 * Convert amount between currencies (placeholder - would need exchange rate API)
 */
export const convertCurrency = (
  amount: number, 
  fromCurrency: string, 
  toCurrency: string,
  exchangeRate?: number
): number => {
  // This is a placeholder - in a real application, you'd integrate with
  // an exchange rate API like exchangerate-api.com or similar
  if (fromCurrency === toCurrency) return amount;
  
  // Use provided exchange rate or return original amount
  return exchangeRate ? amount * exchangeRate : amount;
};

/**
 * Get locale-specific number formatting
 */
export const formatNumber = (value: number, currencyCode?: string): string => {
  const config = getCurrencyConfig(currencyCode);
  
  try {
    const formatter = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals
    });
    
    return formatter.format(value);
  } catch {
    return value.toFixed(config.decimals);
  }
};

/**
 * Initialize currency system (call on app startup)
 */
export const initializeCurrency = (): void => {
  const currentCurrency = getCurrentCurrency();
  
  // Validate current currency setting
  if (!isSupportedCurrency(currentCurrency)) {
    console.warn(`Unsupported currency: ${currentCurrency}, defaulting to USD`);
    
    // Update settings to use USD
    try {
      const settings = localStorage.getItem('pos-system-settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        parsed.currency = 'USD';
        localStorage.setItem('pos-system-settings', JSON.stringify(parsed));
      }
    } catch (error) {
      console.error('Error updating currency setting:', error);
    }
  }
  
  console.log(`Currency system initialized with: ${getCurrencyName(currentCurrency)} (${currentCurrency})`);
};
