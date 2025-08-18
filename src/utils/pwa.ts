// Service Worker Registration
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      console.log('Service Worker registered successfully:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              showUpdateAvailable();
            }
          });
        }
      });
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

const showUpdateAvailable = () => {
  // Show a toast or modal to notify user of available update
  if (confirm('A new version is available. Update now?')) {
    window.location.reload();
  }
};

// Types for PWA events
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync: {
    register: (tag: string) => Promise<void>;
  };
}

// PWA Install Prompt
export const initializePWAInstall = () => {
  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e as BeforeInstallPromptEvent;
    
    // Show install button
    showInstallButton();
  });

  const showInstallButton = () => {
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
          await deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User response to the install prompt: ${outcome}`);
          deferredPrompt = null;
          installButton.style.display = 'none';
        }
      });
    }
  };

  // Handle app installed event
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    // Hide install button if visible
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
  });
};

// Background Sync for offline transactions
export const registerBackgroundSync = async (tag: string) => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      // Type assertion for sync property which exists in some browsers
      await (registration as ServiceWorkerRegistrationWithSync).sync.register(tag);
      console.log('Background sync registered:', tag);
    } catch {
      console.log('Background sync not supported, using fallback');
      // Fallback to immediate sync attempt
      syncOfflineDataFallback();
    }
  }
};

const syncOfflineDataFallback = () => {
  // Fallback sync method for browsers without background sync
  console.log('Attempting fallback sync');
};

// Network status detection
export const initializeNetworkDetection = () => {
  const updateNetworkStatus = () => {
    const isOnline = navigator.onLine;
    document.body.classList.toggle('offline', !isOnline);
    
    // Notify components of network status change
    window.dispatchEvent(new CustomEvent('networkstatuschange', { 
      detail: { isOnline } 
    }));
  };

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  
  // Initial status
  updateNetworkStatus();
};

// Offline data sync
export const syncOfflineData = async () => {
  if (navigator.onLine) {
    try {
      // Trigger background sync
      await registerBackgroundSync('pos-sync');
      console.log('Offline data sync initiated');
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }
};
