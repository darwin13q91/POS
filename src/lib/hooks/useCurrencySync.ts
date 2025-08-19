import { useState, useEffect } from 'react';
import { getCurrentCurrencySync, type CurrencyConfig } from '../currency';

// Hook to keep components synced with currency changes
export function useCurrencySync(): CurrencyConfig {
  const [currency, setCurrency] = useState<CurrencyConfig>(getCurrentCurrencySync());

  useEffect(() => {
    const handleCurrencyChange = () => {
      // Refresh currency from cache/database
      setCurrency(getCurrentCurrencySync());
    };

    // Listen for currency change events
    window.addEventListener('currencyChanged', handleCurrencyChange);
    
    // Also refresh on visibility change (when user switches tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleCurrencyChange();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return currency;
}

// Hook to force refresh all currency displays
export function useForceRefreshCurrency() {
  const [, setForceRefresh] = useState(0);
  
  useEffect(() => {
    const handleCurrencyChange = () => {
      setForceRefresh(prev => prev + 1);
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange);
    };
  }, []);

  const forceRefresh = () => {
    setForceRefresh(prev => prev + 1);
  };

  return { forceRefresh };
}
