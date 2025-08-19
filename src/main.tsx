import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';
import { initializeDatabase, db } from './lib/database';
import { registerServiceWorker, initializePWAInstall, initializeNetworkDetection } from './utils/pwa';
import { debugLog, debugError, debugSuccess, debugTiming, debugStorage, debugNetwork } from './utils/debug';

// Add global debug function to reset database
(window as unknown as Window & { resetDatabase: () => Promise<void> }).resetDatabase = async () => {
  try {
    console.log('Resetting database...');
    
    // Clear all tables
    await db.appUsers.clear();
    await db.systemConfigs.clear();
    await db.rolePermissions.clear();
    await db.businessInfo.clear();
    await db.categories.clear();
    await db.products.clear();
    await db.customers.clear();
    await db.sales.clear();
    
    console.log('Database cleared, reinitializing...');
    
    // Reinitialize with fresh data
    await initializeDatabase();
    
    console.log('Database reset complete! You can now login with:');
    console.log('admin / Admin@2025! (Owner)');
    console.log('manager / Manager@2025! (Manager)');
    console.log('cashier / Cashier@2025! (Staff)');
    console.log('staff / Staff@2025! (Staff)');
    console.log('demo / demo123 (Demo account for testing)');
    console.log('');
    console.log('Currency has been set to Philippine Peso (₱)');
    console.log('Navigate to Settings > System Settings to change currency if needed');
    console.log('Navigate to Settings > User Management to manage user accounts and passwords');
    
    // Reload the page to reset app state
    window.location.reload();
  } catch (error) {
    console.error('Error resetting database:', error);
  }
};

// Initialize the app
const initializeApp = async () => {
  const endTiming = debugTiming('App Initialization');
  
  try {
    debugLog('Starting POS system initialization...');
    debugStorage();
    debugNetwork();
    
    // Initialize the database first
    debugLog('Initializing database...');
    await initializeDatabase();
    debugSuccess('Database initialized successfully');
    
    // Register service worker and initialize PWA features in production
    if (import.meta.env.PROD) {
      debugLog('Registering service worker and PWA features...');
      registerServiceWorker();
      initializePWAInstall();
      debugSuccess('PWA features initialized');
    }

    // Initialize network detection
    debugLog('Initializing network detection...');
    initializeNetworkDetection();
    debugSuccess('Network detection initialized');

    debugLog('Rendering React application...');
    
    // Render the app
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    );
    
    debugSuccess('POS system initialized successfully');
    endTiming();
    
  } catch (error) {
    debugError('Failed to initialize app:', error);
    endTiming();
    
    // Render error state
    const rootElement = document.getElementById('root')!;
    rootElement.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background-color: #f3f4f6;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="text-align: center; padding: 2rem;">
          <h1 style="color: #ef4444; font-size: 2rem; margin-bottom: 1rem;">
            Application Error
          </h1>
          <p style="color: #6b7280; margin-bottom: 2rem;">
            Failed to initialize the POS system. Please refresh the page or contact support.
          </p>
          <button 
            onclick="window.location.reload()" 
            style="
              background-color: #3b82f6;
              color: white;
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 0.5rem;
              cursor: pointer;
              font-size: 1rem;
            "
          >
            Refresh Page
          </button>
          <details style="margin-top: 2rem; text-align: left;">
            <summary style="cursor: pointer; color: #6b7280;">Show Error Details</summary>
            <pre style="
              background-color: #1f2937;
              color: #f9fafb;
              padding: 1rem;
              border-radius: 0.5rem;
              font-size: 0.875rem;
              overflow-x: auto;
              margin-top: 0.5rem;
            ">${error}</pre>
          </details>
        </div>
      </div>
    `;
  }
};

// Initialize the app
initializeApp();
