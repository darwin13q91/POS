import { useState, useEffect } from 'react';
import { User, Shield, LogIn } from 'lucide-react';
import { authService, getRoleConfigs, type UserRole, type User as UserType, type RoleConfig } from '../lib/auth';
import LoginForm from './LoginForm';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

export default function LoginScreen({ onLogin }: LoginProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('staff');
  const [isLoading, setIsLoading] = useState(false);
  const [showProductionLogin, setShowProductionLogin] = useState(false);
  const [roleConfigs, setRoleConfigs] = useState<Record<UserRole, RoleConfig>>({} as Record<UserRole, RoleConfig>);

  useEffect(() => {
    const loadRoleConfigs = async () => {
      try {
        const configs = await getRoleConfigs();
        setRoleConfigs(configs);
      } catch (error) {
        console.error('Failed to load role configurations:', error);
      }
    };
    
    loadRoleConfigs();
  }, []);

  const handleLogin = async (role: UserRole) => {
    setIsLoading(true);
    
    // Demo login based on role
    const usernames = {
      staff: 'staff',
      manager: 'manager', 
      owner: 'admin',
      developer: 'developer',
      support: 'support',
      superadmin: 'superadmin'
    };

    try {
      const user = await authService.login(usernames[role]);
      
      if (user) {
        onLogin(user);
      } else {
        alert('Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }
    
    setIsLoading(false);
  };

  const handleDemoLogin = (role: UserRole) => {
    setSelectedRole(role);
    handleLogin(role);
  };

  // Show production login form if requested
  if (showProductionLogin) {
    return (
      <LoginForm
        onLogin={onLogin}
        onSwitchToDemo={() => setShowProductionLogin(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ModernPOS Access</h1>
          <p className="text-gray-600 mt-2">Choose your role to continue</p>
        </div>

        <div className="space-y-3">
          {Object.keys(roleConfigs).length === 0 ? (
            <div className="text-center py-4 text-gray-500">Loading roles...</div>
          ) : (
            // Filter to show only Staff, Manager, and Owner roles
            Object.entries(roleConfigs)
              .filter(([key]) => ['staff', 'manager', 'owner'].includes(key))
              .map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleDemoLogin(config.role)}
                  disabled={isLoading}
                  className={`w-full p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                    selectedRole === config.role
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${getRoleColor(config.role)}`}>
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900">{config.label}</div>
                      <div className="text-sm text-gray-500">{config.description}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Access Level: {config.accessLevel}/5
                      </div>
                    </div>
                    <LogIn className="h-4 w-4 text-gray-400" />
                  </div>
                </button>
              ))
          )}
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Demo Mode</h3>
          <p className="text-sm text-gray-600 mb-3">
            Quick access for demonstration purposes. No passwords required.
          </p>
          <button
            onClick={() => setShowProductionLogin(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
          >
            Switch to Secure Login
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Different roles have different permissions and interface layouts
          </p>
        </div>
      </div>
    </div>
  );
}

function getRoleColor(role: UserRole): string {
  const colors = {
    staff: 'bg-green-100 text-green-600',
    manager: 'bg-blue-100 text-blue-600',
    owner: 'bg-purple-100 text-purple-600',
    developer: 'bg-orange-100 text-orange-600',
    support: 'bg-red-100 text-red-600',
    superadmin: 'bg-red-100 text-red-800 font-bold border-2 border-red-300'
  };
  return colors[role] || 'bg-gray-100 text-gray-600';
}
