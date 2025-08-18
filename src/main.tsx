import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeDatabase } from './lib/database';
import { registerServiceWorker, initializePWAInstall, initializeNetworkDetection } from './utils/pwa';

// Initialize the database
initializeDatabase().catch(console.error);

// Register service worker and initialize PWA features
if (import.meta.env.PROD) {
  registerServiceWorker();
  initializePWAInstall();
}

// Initialize network detection
initializeNetworkDetection();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
