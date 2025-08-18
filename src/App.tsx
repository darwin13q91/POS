import { useState, useEffect } from 'react';
import RoleBasedNavigation from './components/RoleBasedNavigation';
import MaintenancePanel from './components/MaintenancePanel';
import LoginScreen from './components/LoginScreen';
import POSView from './views/POSView';
import InventoryView from './views/InventoryView';
import AnalyticsView from './views/AnalyticsView';
import CustomersView from './views/CustomersView';
import SettingsView from './views/SettingsView';
import DebugView from './views/DebugView';
import SupportView from './views/SupportView';
import { usePOSStore } from './lib/store';
import { initializeRemoteMaintenance } from './lib/remote-maintenance';
import { authService, type User } from './lib/auth';

function App() {
  const { currentView } = usePOSStore();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize remote maintenance service
    const maintenanceConfig = {
      supportUrl: 'https://your-support-server.com',
      businessId: localStorage.getItem('business-id') || 'demo-business',
      licenseKey: localStorage.getItem('license-key') || 'demo-license',
      lastUpdateCheck: new Date(),
      maintenanceMode: false,
      supportLevel: 'basic' as const
    };
    
    initializeRemoteMaintenance(maintenanceConfig);

    // Check for existing user session
    const existingUser = authService.getCurrentUser();
    if (existingUser) {
      setCurrentUser(existingUser);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const renderCurrentView = () => {
    // Role-based view access control
    if (!currentUser) return null;

    switch (currentView) {
      case 'pos':
        return <POSView />;
      case 'inventory':
        return <InventoryView />;
      case 'sales':
        return <AnalyticsView />;
      case 'customers':
        return <CustomersView />;
      case 'settings':
        return <SettingsView />;
      case 'debug':
        return currentUser.role === 'developer' ? <DebugView /> : <div>Access Denied</div>;
      case 'support':
        return currentUser.role === 'support' ? <SupportView /> : <div>Access Denied</div>;
      default:
        return <POSView />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading POS System...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <RoleBasedNavigation currentUser={currentUser} onLogout={handleLogout} />
      {renderCurrentView()}
      {/* Show maintenance panel only for authorized roles */}
      {(currentUser.role === 'owner' || currentUser.role === 'developer' || currentUser.role === 'support') && (
        <MaintenancePanel />
      )}
    </div>
  );
}

export default App;
