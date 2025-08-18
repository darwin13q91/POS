import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Users, 
  Settings,
  Store,
  Wrench
} from 'lucide-react';
import { usePOSStore } from '../lib/store';
import { getMaintenanceService } from '../lib/remote-maintenance';

const Navigation: React.FC = () => {
  const { currentView, setCurrentView } = usePOSStore();
  const [showMaintenanceInfo, setShowMaintenanceInfo] = useState(false);
  const maintenanceService = getMaintenanceService();

  const navItems = [
    { id: 'pos', label: 'POS', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'sales', label: 'Sales', icon: BarChart3 },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const handleMaintenanceTest = () => {
    setShowMaintenanceInfo(!showMaintenanceInfo);
    if (maintenanceService) {
      const status = maintenanceService.getSystemStatus();
      console.log('Maintenance Service Status:', status);
    }
  };

  return (
    <nav className="bg-white border-r border-gray-200 w-64 min-h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <Store className="h-8 w-8 text-primary-600" />
          <span className="text-xl font-bold text-gray-900">ModernPOS</span>
        </div>
        
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentView(item.id)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors
                    ${isActive 
                      ? 'bg-primary-100 text-primary-700 border-primary-200' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
        
        {/* Test Maintenance Panel Button */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleMaintenanceTest}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors text-blue-600 hover:bg-blue-50"
          >
            <Wrench className="h-5 w-5" />
            <span className="font-medium">Test Maintenance</span>
          </button>
          
          {showMaintenanceInfo && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs">
              <div>Service: {maintenanceService ? '✅ Available' : '❌ Not Found'}</div>
              {maintenanceService && (
                <div className="mt-1">
                  Status: {JSON.stringify(maintenanceService.getSystemStatus(), null, 2)}
                </div>
              )}
              <div className="mt-2 text-blue-600">
                Look for ⚙️ button in bottom-right corner
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          <div>Status: <span className="text-green-600 font-medium">Online</span></div>
          <div className="mt-1">Mode: Offline Ready</div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
