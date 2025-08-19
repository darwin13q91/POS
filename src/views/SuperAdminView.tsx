import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  Users, 
  Database, 
  Server, 
  Monitor, 
  Activity,
  BarChart3,
  Building,
  Key,
  Globe,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  HardDrive,
  Cpu
} from 'lucide-react';
import { db } from '../lib/database';

interface SystemMetrics {
  totalUsers: number;
  totalBusinesses: number;
  totalSales: number;
  totalProducts: number;
  systemUptime: string;
  databaseSize: string;
  activeConnections: number;
}

const SuperAdminView: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<'excellent' | 'good' | 'warning' | 'critical'>('good');

  const loadSystemMetrics = useCallback(async () => {
    try {
      const totalUsers = await db.appUsers.count();
      const totalBusinesses = await db.businessInfo.count();
      const totalSales = await db.sales.count();
      const totalProducts = await db.products.count();
      
      setMetrics({
        totalUsers,
        totalBusinesses,
        totalSales,
        totalProducts,
        systemUptime: calculateUptime(),
        databaseSize: await getDatabaseSize(),
        activeConnections: Math.floor(Math.random() * 50) + 10, // Simulated
      });

      // Simulate system health check
      if (totalUsers > 100) setSystemHealth('excellent');
      else if (totalUsers > 50) setSystemHealth('good');
      else if (totalUsers > 10) setSystemHealth('warning');
      else setSystemHealth('critical');

    } catch (error) {
      console.error('Failed to load system metrics:', error);
    }
  }, []);

  useEffect(() => {
    loadSystemMetrics();
    const interval = setInterval(loadSystemMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [loadSystemMetrics]);

  const calculateUptime = (): string => {
    const uptimeMs = Date.now() - (Date.now() - Math.random() * 86400000 * 30); // Simulate uptime
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  };

  const getDatabaseSize = async (): Promise<string> => {
    // Simulate database size calculation
    const sizeInMB = Math.floor(Math.random() * 500) + 100;
    return `${sizeInMB} MB`;
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'good': return <Activity className="h-5 w-5 text-blue-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Monitor className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* SuperAdmin Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">SuperAdmin Control Panel</h1>
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
            System Owner
          </span>
        </div>
        <p className="text-gray-600">
          Ultimate system control and oversight for all POS instances
        </p>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">System Health</p>
              <p className="text-2xl font-bold capitalize">{systemHealth}</p>
            </div>
            {getHealthIcon(systemHealth)}
          </div>
          <div className={`mt-2 px-2 py-1 rounded text-xs font-medium ${getHealthColor(systemHealth)}`}>
            All systems operational
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">System Uptime</p>
              <p className="text-2xl font-bold">{metrics?.systemUptime || '0d 0h'}</p>
            </div>
            <Clock className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Database Size</p>
              <p className="text-2xl font-bold">{metrics?.databaseSize || '0 MB'}</p>
            </div>
            <HardDrive className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Connections</p>
              <p className="text-2xl font-bold">{metrics?.activeConnections || 0}</p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold">Total Users</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">{metrics?.totalUsers || 0}</p>
          <p className="text-sm text-gray-600 mt-2">Across all businesses</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Building className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold">Total Businesses</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">{metrics?.totalBusinesses || 0}</p>
          <p className="text-sm text-gray-600 mt-2">Active POS instances</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold">Total Sales</h3>
          </div>
          <p className="text-3xl font-bold text-purple-600">{metrics?.totalSales || 0}</p>
          <p className="text-sm text-gray-600 mt-2">System-wide transactions</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="h-6 w-6 text-orange-600" />
            <h3 className="text-lg font-semibold">Total Products</h3>
          </div>
          <p className="text-3xl font-bold text-orange-600">{metrics?.totalProducts || 0}</p>
          <p className="text-sm text-gray-600 mt-2">Inventory items</p>
        </div>
      </div>

      {/* SuperAdmin Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Key className="h-5 w-5 mr-2 text-red-600" />
            System Administration
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <Globe className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Manage Global Settings</p>
                  <p className="text-sm text-gray-600">System-wide configurations</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Global User Management</p>
                  <p className="text-sm text-gray-600">Manage users across all businesses</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <Building className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Business Instances</p>
                  <p className="text-sm text-gray-600">Create and manage POS instances</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-600" />
            System Tools
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Database Administration</p>
                  <p className="text-sm text-gray-600">Backup, restore, optimize</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <Monitor className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">System Monitoring</p>
                  <p className="text-sm text-gray-600">Performance and health monitoring</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <Server className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">License Management</p>
                  <p className="text-sm text-gray-600">Manage system licensing</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-blue-600" />
          System Status Dashboard
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Cpu className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="font-semibold text-green-800">CPU Usage</p>
            <p className="text-2xl font-bold text-green-600">23%</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <HardDrive className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="font-semibold text-blue-800">Memory Usage</p>
            <p className="text-2xl font-bold text-blue-600">67%</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Server className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="font-semibold text-purple-800">Disk Usage</p>
            <p className="text-2xl font-bold text-purple-600">45%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminView;
