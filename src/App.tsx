import { useState, useEffect } from 'react';
import RoleBasedNavigation from './components/RoleBasedNavigation';
import MaintenancePanel from './components/MaintenancePanel';
import LoginScreen from './components/LoginScreen';
import DatabaseTest from './components/DatabaseTest';
import POSView from './views/POSView';
import InventoryView from './views/InventoryView';
import AnalyticsView from './views/AnalyticsView';
import CustomersView from './views/CustomersView';
import SettingsView from './views/SettingsView';
import DebugView from './views/DebugView';
import SupportView from './views/SupportView';
import SuperAdminView from './views/SuperAdminView';
import PayrollView from './views/PayrollView';
import EmployeeManagement from './views/EmployeeManagement';
import TimeTrackingView from './views/TimeTrackingView';
import { usePOSStore } from './lib/store';
import { initializeRemoteMaintenance } from './lib/remote-maintenance';
import { authService, type User } from './lib/auth';

function App() {
  const { currentView } = usePOSStore();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
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
      } catch (err) {
        console.error('App initialization error:', err);
        setError(`Initialization failed: ${err}`);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
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

    // Helper function to check if user has access
    const hasAccess = (allowedRoles: string[]): boolean => {
      return currentUser.role === 'superadmin' || allowedRoles.includes(currentUser.role);
    };

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
      case 'payroll':
        return hasAccess(['owner', 'manager']) ? 
          <PayrollView /> : <div>Access Denied</div>;
      case 'employees':
        return hasAccess(['owner', 'manager']) ? 
          <EmployeeManagement /> : <div>Access Denied</div>;
      case 'timetracking':
        return hasAccess(['owner', 'manager', 'staff']) ? 
          <TimeTrackingView /> : <div>Access Denied</div>;
      case 'debug':
        return hasAccess(['developer']) ? <DebugView /> : <div>Access Denied</div>;
      case 'support':
        return hasAccess(['support']) ? <SupportView /> : <div>Access Denied</div>;
      case 'system':
        return currentUser.role === 'superadmin' ? <SuperAdminView /> : <div>Access Denied</div>;
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  // Show database test if URL contains ?debug=db
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('debug') === 'db') {
    return <DatabaseTest />;
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <RoleBasedNavigation currentUser={currentUser} onLogout={handleLogout} />
      {renderCurrentView()}
      {/* Show maintenance panel only for authorized roles */}
      {(currentUser.role === 'owner' || currentUser.role === 'developer' || currentUser.role === 'support' || currentUser.role === 'superadmin') && (
        <MaintenancePanel />
      )}
    </div>
  );
}

export default App;
