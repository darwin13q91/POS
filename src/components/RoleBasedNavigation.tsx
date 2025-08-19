import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Users, 
  Settings,
  Store,
  Wrench,
  Shield,
  UserCheck,
  LogOut,
  Code,
  HeadphonesIcon,
  Crown,
  UserCog,
  DollarSign,
  Clock,
  UserPlus
} from 'lucide-react';
import { usePOSStore } from '../lib/store';
import { getMaintenanceService } from '../lib/remote-maintenance';
import { authService, type UserRole, type User } from '../lib/auth';
import { DateUtils } from '../utils/dateUtils';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

interface RoleBasedNavigationProps {
  currentUser: User;
  onLogout: () => void;
}

const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({ 
  currentUser, 
  onLogout 
}) => {
  const { currentView, setCurrentView } = usePOSStore();
  const [showMaintenanceInfo, setShowMaintenanceInfo] = useState(false);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const maintenanceService = getMaintenanceService();

  // Load navigation items on component mount and when user changes
  useEffect(() => {
    const loadNavigationItems = async () => {
      try {
        const baseItems = [];

        // POS - Available to all roles
        if (await authService.canAccessModule('pos')) {
          baseItems.push({ 
            id: 'pos', 
            label: 'POS', 
            icon: ShoppingCart,
            roles: ['staff', 'manager', 'owner', 'developer']
          });
        }

        // Inventory - Limited for staff
        if (await authService.canAccessModule('inventory')) {
          baseItems.push({ 
            id: 'inventory', 
            label: 'Inventory', 
            icon: Package,
            roles: ['staff', 'manager', 'owner', 'developer', 'support']
          });
        }

        // Sales/Analytics - Not for basic staff
        if (await authService.canAccessModule('reports')) {
          baseItems.push({ 
            id: 'sales', 
            label: currentUser.role === 'owner' ? 'Business Analytics' : 'Sales Reports', 
            icon: BarChart3,
            roles: ['manager', 'owner', 'developer', 'support']
          });
        }

        // Customers
        if (await authService.canAccessModule('customers')) {
          baseItems.push({ 
            id: 'customers', 
            label: 'Customers', 
            icon: Users,
            roles: ['staff', 'manager', 'owner', 'developer']
          });
        }

        // Settings - Role-specific access
        if (await authService.canAccessModule('settings')) {
          let settingsLabel = 'Settings';
          if (currentUser.role === 'owner') settingsLabel = 'Business Settings';
          if (currentUser.role === 'developer') settingsLabel = 'System Settings';
          
          baseItems.push({ 
            id: 'settings', 
            label: settingsLabel, 
            icon: Settings,
            roles: ['manager', 'owner', 'developer', 'support']
          });
        }

        // Payroll - Manager and Owner only
        if (currentUser.role === 'manager' || currentUser.role === 'owner') {
          baseItems.push({
            id: 'payroll',
            label: 'Payroll',
            icon: DollarSign,
            roles: ['manager', 'owner']
          });

          baseItems.push({
            id: 'employees',
            label: 'Employees',
            icon: UserPlus,
            roles: ['manager', 'owner']
          });
        }

        // Time Tracking - Available to staff, managers, and owners
        if (currentUser.role === 'staff' || currentUser.role === 'manager' || currentUser.role === 'owner') {
          baseItems.push({
            id: 'timetracking',
            label: 'Time Tracking',
            icon: Clock,
            roles: ['staff', 'manager', 'owner']
          });
        }

        // Developer-specific items
        if (currentUser.role === 'developer') {
          baseItems.push({
            id: 'debug',
            label: 'Debug Console',
            icon: Code,
            roles: ['developer']
          });
        }

        // Support-specific items
        if (currentUser.role === 'support') {
          baseItems.push({
            id: 'support',
            label: 'Support Dashboard',
            icon: HeadphonesIcon,
            roles: ['support']
          });
        }

        // SuperAdmin-specific items
        if (currentUser.role === 'superadmin') {
          baseItems.push({
            id: 'system',
            label: 'System Control',
            icon: Shield,
            roles: ['superadmin']
          });
        }

        const filteredItems = baseItems.filter(item => 
          item.roles.includes(currentUser.role)
        );
        
        setNavigationItems(filteredItems);
      } catch (error) {
        console.error('Error loading navigation items:', error);
        setNavigationItems([]);
      }
    };

    loadNavigationItems();
  }, [currentUser.role]);

  const handleMaintenanceTest = () => {
    setShowMaintenanceInfo(!showMaintenanceInfo);
    if (maintenanceService) {
      const status = maintenanceService.getSystemStatus();
      console.log('Maintenance Service Status:', status);
    }
  };

  const getUserRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'staff': return <UserCheck className="h-4 w-4" />;
      case 'manager': return <UserCog className="h-4 w-4" />;
      case 'owner': return <Crown className="h-4 w-4" />;
      case 'developer': return <Code className="h-4 w-4" />;
      case 'support': return <HeadphonesIcon className="h-4 w-4" />;
      case 'superadmin': return <Shield className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getUserRoleColor = (role: UserRole) => {
    switch (role) {
      case 'staff': return 'text-green-600 bg-green-50';
      case 'manager': return 'text-blue-600 bg-blue-50';
      case 'owner': return 'text-purple-600 bg-purple-50';
      case 'developer': return 'text-orange-600 bg-orange-50';
      case 'support': return 'text-red-600 bg-red-50';
      case 'superadmin': return 'text-red-800 bg-red-100 border border-red-200';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <nav className="bg-white border-r border-gray-200 w-64 min-h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Store className="h-8 w-8 text-primary-600" />
          <span className="text-xl font-bold text-gray-900">ModernPOS</span>
        </div>
        
        {/* User Info Card */}
        <div className={`p-3 rounded-lg mb-6 ${getUserRoleColor(currentUser.role)}`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-white shadow-sm">
              {getUserRoleIcon(currentUser.role)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {currentUser.username}
              </div>
              <div className="text-sm text-gray-600 capitalize">
                {currentUser.role}
              </div>
            </div>
          </div>
        </div>
        
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentView(item.id as 'pos' | 'inventory' | 'sales' | 'customers' | 'settings' | 'debug' | 'support')}
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
        
        {/* Role-specific maintenance access */}
        {(currentUser.role === 'developer' || currentUser.role === 'support' || currentUser.role === 'owner') && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleMaintenanceTest}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors text-blue-600 hover:bg-blue-50"
            >
              <Wrench className="h-5 w-5" />
              <span className="font-medium">System Maintenance</span>
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
        )}
      </div>
      
      {/* Bottom section with logout */}
      <div className="mt-auto p-6 border-t border-gray-200">
        <div className="text-sm text-gray-500 mb-3">
          <div>Business ID: {currentUser.businessId}</div>
          <div>Last Login: {DateUtils.formatDate(currentUser.lastLogin)}</div>
        </div>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </nav>
  );
};

export default RoleBasedNavigation;
