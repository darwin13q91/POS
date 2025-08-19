// Simple debugging utility for development
export const debugLog = (message: string, data?: unknown) => {
  if (import.meta.env.DEV) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔧 POS Debug:`, message, data || '');
  }
};

export const debugError = (message: string, error?: unknown) => {
  if (import.meta.env.DEV) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ POS Error:`, message, error || '');
  }
};

export const debugSuccess = (message: string, data?: unknown) => {
  if (import.meta.env.DEV) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ POS Success:`, message, data || '');
  }
};

// Performance timing utility
export const debugTiming = (label: string) => {
  if (import.meta.env.DEV) {
    const start = performance.now();
    return () => {
      const end = performance.now();
      const duration = (end - start).toFixed(2);
      console.log(`[TIMING] ⏱️ ${label}: ${duration}ms`);
    };
  }
  return () => {}; // No-op in production
};

// Storage debugging
export const debugStorage = () => {
  if (import.meta.env.DEV) {
    console.group('🗄️ Storage Status');
    console.log('LocalStorage items:', localStorage.length);
    console.log('SessionStorage items:', sessionStorage.length);
    console.log('IndexedDB support:', 'indexedDB' in window);
    console.groupEnd();
  }
};

// Network debugging  
export const debugNetwork = () => {
  if (import.meta.env.DEV) {
    console.group('🌐 Network Status');
    console.log('Online:', navigator.onLine);
    const connection = (navigator as { connection?: { effectiveType?: string } }).connection;
    console.log('Connection:', connection?.effectiveType || 'Unknown');
    console.groupEnd();
  }
};
