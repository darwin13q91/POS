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

        // Initialize currency cache from database
        try {
          const { getCurrentCurrency } = await import('./lib/currency');
          await getCurrentCurrency(); // This will cache the currency setting
        } catch (currencyError) {
          console.error('Failed to initialize currency cache:', currencyError);
        }

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

    // Access denied component with better styling
    const AccessDeniedComponent = ({ viewName }: { viewName: string }) => (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-1">You don't have permission to access {viewName}.</p>
          <p className="text-sm text-gray-500">Current role: <span className="font-medium text-gray-700">{currentUser.role}</span></p>
        </div>
      </div>
    );

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
          <PayrollView /> : <AccessDeniedComponent viewName="Payroll Management" />;
      case 'employees':
        return hasAccess(['owner', 'manager']) ? 
          <EmployeeManagement /> : <AccessDeniedComponent viewName="Employee Management" />;
      case 'timetracking':
        return hasAccess(['owner', 'manager', 'staff']) ? 
          <TimeTrackingView /> : <AccessDeniedComponent viewName="Time Tracking" />;
      case 'debug':
        return hasAccess(['developer']) ? <DebugView /> : <AccessDeniedComponent viewName="Debug Console" />;
      case 'support':
        return hasAccess(['support']) ? <SupportView /> : <AccessDeniedComponent viewName="Support Dashboard" />;
      case 'system':
        return currentUser.role === 'superadmin' ? 
          <SuperAdminView /> : <AccessDeniedComponent viewName="System Control Panel" />;
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
