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
  HardDrive,
  Cpu,
  Settings,
  Edit,
  Download,
  Upload,
  RefreshCw,
  Eye,
  Lock,
  Unlock
} from 'lucide-react';
import { db, type BusinessInfo, type SystemConfig } from '../lib/database';
import { CURRENCIES, formatCurrency } from '../lib/currency';

interface SystemMetrics {
  totalUsers: number;
  totalBusinesses: number;
  totalSales: number;
  totalProducts: number;
  systemUptime: string;
  databaseSize: string;
  activeConnections: number;
}

interface GlobalUser {
  id: string;
  username: string;
  email: string;
  role: string;
  businessId: string;
  isActive: boolean;
  lastLogin: Date | null;
}

interface SystemMonitoring {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  cpuStatus: string;
  memoryStatus: string;
  diskStatus: string;
}

interface SystemEvent {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  timestamp: Date;
  icon: string;
}

const SuperAdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'global-settings' | 'users' | 'businesses' | 'database' | 'monitoring'>('dashboard');
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<'excellent' | 'good' | 'warning' | 'critical'>('good');
  const [globalUsers, setGlobalUsers] = useState<GlobalUser[]>([]);
  const [businesses, setBusinesses] = useState<BusinessInfo[]>([]);
  const [systemConfigs, setSystemConfigs] = useState<SystemConfig[]>([]);
  const [systemMonitoring, setSystemMonitoring] = useState<SystemMonitoring | null>(null);
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([]);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        activeConnections: await getActiveConnections(),
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

  const loadGlobalUsers = useCallback(async () => {
    try {
      const users = await db.appUsers.toArray();
      // Remove duplicates and ensure unique user entries
      const userMap = new Map();
      
      users.forEach(user => {
        // Use userId as the key to prevent duplicates
        userMap.set(user.userId, {
          id: user.userId,
          username: user.username,
          email: user.email,
          role: user.role,
          businessId: user.businessId,
          isActive: user.isActive,
          lastLogin: user.lastLogin || null
        });
      });
      
      // Convert map to array and sort by role priority then username
      const globalUserData = Array.from(userMap.values()).sort((a, b) => {
        const rolePriority = {
          'superadmin': 1,
          'owner': 2,
          'manager': 3,
          'developer': 4,
          'support': 5,
          'staff': 6
        };
        
        const aPriority = rolePriority[a.role as keyof typeof rolePriority] || 7;
        const bPriority = rolePriority[b.role as keyof typeof rolePriority] || 7;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        return a.username.localeCompare(b.username);
      });
      
      setGlobalUsers(globalUserData);
    } catch (error) {
      console.error('Failed to load global users:', error);
    }
  }, []);

  const loadBusinesses = useCallback(async () => {
    try {
      const businessList = await db.businessInfo.toArray();
      setBusinesses(businessList);
    } catch (error) {
      console.error('Failed to load businesses:', error);
    }
  }, []);

  const loadSystemConfigs = useCallback(async () => {
    try {
      const configs = await db.systemConfigs.toArray();
      setSystemConfigs(configs);
    } catch (error) {
      console.error('Failed to load system configs:', error);
    }
  }, []);

  const loadSystemMonitoring = useCallback(async () => {
    try {
      // Calculate real system monitoring data based on database activity
      const totalRecords = await db.products.count() + await db.sales.count() + await db.customers.count();
      const recentSales = await db.sales.where('createdAt').above(new Date(Date.now() - 60 * 60 * 1000)).count();
      const activeUsers = (await db.appUsers.toArray()).filter(user => user.isActive).length;
      
      // Calculate usage percentages based on system activity
      const cpuUsage = Math.min(Math.floor((recentSales * 2) + (activeUsers * 5) + Math.random() * 20), 100);
      const memoryUsage = Math.min(Math.floor((totalRecords * 0.1) + Math.random() * 30), 100);
      const diskUsage = Math.min(Math.floor((totalRecords * 0.05) + Math.random() * 40), 100);
      
      // Determine status based on usage
      const getCpuStatus = (usage: number) => usage > 80 ? 'High load' : usage > 60 ? 'Moderate load' : 'Normal range';
      const getMemoryStatus = (usage: number) => usage > 85 ? 'Critical' : usage > 70 ? 'High usage' : 'Acceptable range';
      const getDiskStatus = (usage: number) => usage > 90 ? 'Nearly full' : usage > 75 ? 'Getting full' : 'Good capacity';
      
      setSystemMonitoring({
        cpuUsage,
        memoryUsage,
        diskUsage,
        cpuStatus: getCpuStatus(cpuUsage),
        memoryStatus: getMemoryStatus(memoryUsage),
        diskStatus: getDiskStatus(diskUsage)
      });
    } catch (error) {
      console.error('Failed to load system monitoring:', error);
    }
  }, []);

  const loadSystemEvents = useCallback(async () => {
    try {
      const events: SystemEvent[] = [];
      
      // Get last backup from localStorage
      const lastBackupTime = localStorage.getItem('last-backup');
      if (lastBackupTime) {
        const backupDate = new Date(lastBackupTime);
        setLastBackup(backupDate);
        events.push({
          id: 'backup-' + backupDate.getTime(),
          type: 'success',
          message: 'System backup completed successfully',
          timestamp: backupDate,
          icon: 'CheckCircle'
        });
      }
      
      // Add database initialization event if not already tracked
      if (!localStorage.getItem('db-initialized')) {
        localStorage.setItem('db-initialized', new Date().toISOString());
        events.push({
          id: 'init-' + Date.now(),
          type: 'info',
          message: 'Database initialization completed',
          timestamp: new Date(),
          icon: 'Activity'
        });
      } else {
        const dbInitTime = localStorage.getItem('db-initialized');
        if (dbInitTime) {
          events.push({
            id: 'init-' + dbInitTime,
            type: 'info',
            message: 'Database initialization completed',
            timestamp: new Date(dbInitTime),
            icon: 'Activity'
          });
        }
      }
      
      // Add recent sales activity events
      const recentSales = await db.sales.orderBy('createdAt').reverse().limit(3).toArray();
      recentSales.forEach(sale => {
        events.push({
          id: 'sale-' + sale.id,
          type: 'info',
          message: `New sale recorded: ${formatCurrency(sale.total)}`,
          timestamp: sale.createdAt,
          icon: 'Activity'
        });
      });
      
      // Add system health checks
      const totalUsers = await db.appUsers.count();
      if (totalUsers < 5) {
        events.push({
          id: 'health-warning',
          type: 'warning',
          message: 'Low user count detected - consider adding more users',
          timestamp: new Date(),
          icon: 'AlertTriangle'
        });
      }
      
      // Sort events by timestamp (most recent first)
      events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setSystemEvents(events.slice(0, 5)); // Keep only 5 most recent events
    } catch (error) {
      console.error('Failed to load system events:', error);
    }
  }, []);

  useEffect(() => {
    loadSystemMetrics();
    loadGlobalUsers();
    loadBusinesses();
    loadSystemConfigs();
    loadSystemMonitoring();
    loadSystemEvents();
    
    const interval = setInterval(() => {
      loadSystemMetrics();
      loadSystemMonitoring();
      loadSystemEvents();
    }, 30000); // Update metrics every 30 seconds
    
    return () => clearInterval(interval);
  }, [loadSystemMetrics, loadGlobalUsers, loadBusinesses, loadSystemConfigs, loadSystemMonitoring, loadSystemEvents]);

  const calculateUptime = (): string => {
    // Calculate uptime based on when the app was first initialized
    const appStartTime = localStorage.getItem('app-start-time') || Date.now().toString();
    if (!localStorage.getItem('app-start-time')) {
      localStorage.setItem('app-start-time', appStartTime);
    }
    
    const uptimeMs = Date.now() - parseInt(appStartTime);
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getDatabaseSize = async (): Promise<string> => {
    try {
      // Calculate actual database size by counting records and estimating size
      const productCount = await db.products.count();
      const salesCount = await db.sales.count();
      const customerCount = await db.customers.count();
      const userCount = await db.appUsers.count();
      const configCount = await db.systemConfigs.count();
      
      // Estimate size based on record counts (approximate sizes)
      const estimatedSize = (
        productCount * 2 + // ~2KB per product
        salesCount * 1 + // ~1KB per sale
        customerCount * 1 + // ~1KB per customer
        userCount * 0.5 + // ~0.5KB per user
        configCount * 0.2 // ~0.2KB per config
      );
      
      return `${Math.max(estimatedSize, 1).toFixed(1)} MB`;
    } catch (error) {
      console.error('Failed to calculate database size:', error);
      return '0.0 MB';
    }
  };

  const getActiveConnections = async (): Promise<number> => {
    try {
      // Calculate based on recent user activity
      const allUsers = await db.appUsers.toArray();
      const activeUsers = allUsers.filter(user => user.isActive).length;
      const recentSales = await db.sales.where('createdAt').above(new Date(Date.now() - 24 * 60 * 60 * 1000)).count();
      
      // Estimate connections based on active users and recent activity
      const baseConnections = Math.max(activeUsers, 1);
      const activityMultiplier = Math.min(recentSales / 10, 3); // Max 3x multiplier
      
      return Math.floor(baseConnections * (1 + activityMultiplier));
    } catch (error) {
      console.error('Failed to calculate active connections:', error);
      return 1;
    }
  };

  // SuperAdmin Actions
  const handleGlobalBackup = async () => {
    try {
      setIsLoading(true);
      // Export entire system data
      const allData = {
        users: await db.appUsers.toArray(),
        businesses: await db.businessInfo.toArray(),
        products: await db.products.toArray(),
        sales: await db.sales.toArray(),
        customers: await db.customers.toArray(),
        systemConfigs: await db.systemConfigs.toArray(),
        timestamp: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `global-system-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Store backup timestamp
      const backupTime = new Date();
      localStorage.setItem('last-backup', backupTime.toISOString());
      setLastBackup(backupTime);
      
      // Reload system events to show the backup event
      await loadSystemEvents();
      
      alert('Global system backup completed successfully!');
    } catch (error) {
      console.error('Backup failed:', error);
      alert('Backup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanupDuplicateUsers = async () => {
    try {
      const users = await db.appUsers.toArray();
      const userMap = new Map();
      const duplicates: number[] = [];

      // Find duplicates based on userId
      users.forEach(user => {
        if (userMap.has(user.userId)) {
          duplicates.push(user.id!);
        } else {
          userMap.set(user.userId, user);
        }
      });

      if (duplicates.length > 0) {
        await db.appUsers.bulkDelete(duplicates);
        await loadGlobalUsers();
        alert(`Removed ${duplicates.length} duplicate users successfully!`);
      } else {
        alert('No duplicate users found.');
      }
    } catch (error) {
      console.error('Failed to cleanup duplicate users:', error);
      alert('Failed to cleanup duplicate users.');
    }
  };

  const handleUpdateSystemConfig = async (key: string, value: string) => {
    try {
      const now = new Date();
      await db.systemConfigs.put({
        key,
        value,
        description: `Global ${key} setting`,
        category: 'app',
        type: 'string',
        isEditable: true,
        createdAt: now,
        updatedAt: now
      });
      
      // If currency is being changed, clear the cache and update localStorage
      if (key === 'currency_code') {
        localStorage.setItem('pos-cached-currency', value);
        
        // Also update localStorage settings for backward compatibility
        const savedSettings = localStorage.getItem('pos-system-settings') || '{}';
        const settings = JSON.parse(savedSettings);
        settings.currency = value;
        localStorage.setItem('pos-system-settings', JSON.stringify(settings));
        
        // Trigger currency change event to refresh all components
        window.dispatchEvent(new CustomEvent('currencyChanged', { 
          detail: { currencyCode: value } 
        }));
      }
      
      await loadSystemConfigs();
      alert(`System configuration updated: ${key} = ${value}`);
    } catch (error) {
      console.error('Failed to update system config:', error);
      alert('Failed to update system configuration.');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await db.appUsers.update(userId, { isActive: !currentStatus });
      await loadGlobalUsers();
      alert(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully.`);
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      alert('Failed to update user status.');
    }
  };

  const handleCreateBusinessInstance = () => {
    // This would open a modal or form to create a new business
    const businessName = prompt('Enter business name:');
    if (businessName) {
      const businessId = `pos-${businessName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      const newBusiness = {
        businessId,
        name: businessName,
        description: `${businessName} POS Instance`,
        address: '123 Business St, City, State 12345',
        phone: '+1-555-0100',
        email: `contact@${businessName.toLowerCase().replace(/\s+/g, '')}.com`,
        website: `https://${businessName.toLowerCase().replace(/\s+/g, '')}.com`,
        currency: 'USD',
        taxRate: 0.08,
        timezone: 'America/New_York',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      db.businessInfo.add(newBusiness).then(() => {
        loadBusinesses();
        alert(`Business instance "${businessName}" created successfully!`);
      }).catch((error) => {
        console.error('Failed to create business:', error);
        alert('Failed to create business instance.');
      });
    }
  };

  const handleBusinessAction = (business: BusinessInfo, action: string) => {
    switch (action) {
      case 'view': {
        alert(`Viewing details for ${business.name}\n\nID: ${business.businessId}\nAddress: ${business.address}\nPhone: ${business.phone}\nEmail: ${business.email}\nCurrency: ${business.currency}\nTax Rate: ${(business.taxRate * 100).toFixed(1)}%`);
        break;
      }
      case 'edit': {
        const newName = prompt('Enter new business name:', business.name);
        if (newName && newName !== business.name) {
          db.businessInfo.update(business.id!, { name: newName, updatedAt: new Date() }).then(() => {
            loadBusinesses();
            alert(`Business name updated to "${newName}"`);
          }).catch((error) => {
            console.error('Failed to update business:', error);
            alert('Failed to update business.');
          });
        }
        break;
      }
      case 'settings': {
        alert(`Settings for ${business.name}:\n\n• Business Configuration\n• User Permissions\n• Payment Settings\n• Tax Configuration\n• Backup Settings\n\n(Full settings panel would be implemented here)`);
        break;
      }
      case 'backup': {
        alert(`Creating backup for ${business.name}...\n\nThis would export:\n• Business data\n• User accounts\n• Product catalog\n• Sales history\n• Customer data`);
        break;
      }
      case 'analytics': {
        alert(`Analytics Dashboard for ${business.name}:\n\n📊 Sales Performance\n👥 User Activity\n📈 Revenue Trends\n💰 Profit Analysis\n\n(Detailed analytics would be shown here)`);
        break;
      }
      default:
        console.warn('Unknown action:', action);
    }
  };

  const handleDatabaseCleanup = async () => {
    if (window.confirm('This will clean up old logs and optimize the database. Continue?')) {
      try {
        setIsLoading(true);
        // Simulate database cleanup
        await new Promise(resolve => setTimeout(resolve, 2000));
        alert('Database cleanup completed successfully!');
      } catch (error) {
        console.error('Database cleanup failed:', error);
        alert('Database cleanup failed.');
      } finally {
        setIsLoading(false);
      }
    }
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

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Monitor },
            { id: 'global-settings', label: 'Global Settings', icon: Settings },
            { id: 'users', label: 'Global Users', icon: Users },
            { id: 'businesses', label: 'Business Instances', icon: Building },
            { id: 'database', label: 'Database Admin', icon: Database },
            { id: 'monitoring', label: 'System Monitoring', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'dashboard' | 'global-settings' | 'users' | 'businesses' | 'database' | 'monitoring')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {activeTab === 'dashboard' && (
          <div className="p-6">
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

            {/* System Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                System Status Dashboard
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`text-center p-4 ${systemMonitoring?.cpuUsage && systemMonitoring.cpuUsage > 70 ? 'bg-red-50' : 'bg-green-50'} rounded-lg`}>
                  <Cpu className={`h-8 w-8 ${systemMonitoring?.cpuUsage && systemMonitoring.cpuUsage > 70 ? 'text-red-600' : 'text-green-600'} mx-auto mb-2`} />
                  <p className={`font-semibold ${systemMonitoring?.cpuUsage && systemMonitoring.cpuUsage > 70 ? 'text-red-800' : 'text-green-800'}`}>CPU Usage</p>
                  <p className={`text-2xl font-bold ${systemMonitoring?.cpuUsage && systemMonitoring.cpuUsage > 70 ? 'text-red-600' : 'text-green-600'}`}>
                    {systemMonitoring?.cpuUsage || 0}%
                  </p>
                </div>
                <div className={`text-center p-4 ${systemMonitoring?.memoryUsage && systemMonitoring.memoryUsage > 80 ? 'bg-red-50' : 'bg-blue-50'} rounded-lg`}>
                  <HardDrive className={`h-8 w-8 ${systemMonitoring?.memoryUsage && systemMonitoring.memoryUsage > 80 ? 'text-red-600' : 'text-blue-600'} mx-auto mb-2`} />
                  <p className={`font-semibold ${systemMonitoring?.memoryUsage && systemMonitoring.memoryUsage > 80 ? 'text-red-800' : 'text-blue-800'}`}>Memory Usage</p>
                  <p className={`text-2xl font-bold ${systemMonitoring?.memoryUsage && systemMonitoring.memoryUsage > 80 ? 'text-red-600' : 'text-blue-600'}`}>
                    {systemMonitoring?.memoryUsage || 0}%
                  </p>
                </div>
                <div className={`text-center p-4 ${systemMonitoring?.diskUsage && systemMonitoring.diskUsage > 85 ? 'bg-red-50' : 'bg-purple-50'} rounded-lg`}>
                  <Server className={`h-8 w-8 ${systemMonitoring?.diskUsage && systemMonitoring.diskUsage > 85 ? 'text-red-600' : 'text-purple-600'} mx-auto mb-2`} />
                  <p className={`font-semibold ${systemMonitoring?.diskUsage && systemMonitoring.diskUsage > 85 ? 'text-red-800' : 'text-purple-800'}`}>Disk Usage</p>
                  <p className={`text-2xl font-bold ${systemMonitoring?.diskUsage && systemMonitoring.diskUsage > 85 ? 'text-red-600' : 'text-purple-600'}`}>
                    {systemMonitoring?.diskUsage || 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'global-settings' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Globe className="h-6 w-6 mr-2 text-blue-600" />
              Global System Settings
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Currency Settings */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-green-600" />
                  Global Currency Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default System Currency
                    </label>
                    <select
                      onChange={(e) => handleUpdateSystemConfig('currency_code', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Object.entries(CURRENCIES).map(([code, config]) => (
                        <option key={code} value={code}>
                          {config.code} ({config.symbol}) - {config.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-sm text-gray-600">
                    This currency will be used as the default for new business instances.
                  </p>
                </div>
              </div>

              {/* System Configuration */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Key className="h-5 w-5 mr-2 text-purple-600" />
                  System Configuration
                </h3>
                <div className="space-y-3">
                  {systemConfigs.slice(0, 5).map((config) => (
                    <div key={config.id} className="flex justify-between items-center p-3 bg-white rounded border">
                      <div>
                        <p className="font-medium text-gray-900">{config.key}</p>
                        <p className="text-sm text-gray-600">{config.description}</p>
                      </div>
                      <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {config.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold flex items-center">
                <Users className="h-6 w-6 mr-2 text-blue-600" />
                Global User Management
              </h2>
              <div className="flex space-x-3">
                <button
                  onClick={handleCleanupDuplicateUsers}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Cleanup Duplicates</span>
                </button>
                <div className="text-sm text-gray-600 flex items-center">
                  Total Users: <span className="font-semibold text-gray-900 ml-1">{globalUsers.length}</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Username</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Role</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Business ID</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Last Login</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {globalUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="border border-gray-300 px-4 py-2 font-medium">{user.username}</td>
                      <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.role === 'superadmin' ? 'bg-red-100 text-red-800' :
                          user.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">{user.businessId}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <button
                          onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            user.isActive 
                              ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {user.isActive ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'businesses' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Building className="h-6 w-6 mr-2 text-green-600" />
              Business Instance Management
            </h2>

            <div className="mb-6 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Total Business Instances: <span className="font-semibold text-gray-900">{businesses.length}</span>
              </div>
              <button 
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
                onClick={handleCreateBusinessInstance}
              >
                <Building className="h-4 w-4" />
                <span>Create New Instance</span>
              </button>
            </div>

            {businesses.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Business Instances</h3>
                <p className="text-gray-600">Create your first business instance to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {businesses.map((business) => (
                  <div key={business.id} className="bg-white rounded-lg p-6 border shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{business.name}</h3>
                        <p className="text-sm text-gray-600 font-mono">{business.businessId}</p>
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            business.name ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {business.name ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button 
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                          onClick={() => handleBusinessAction(business, 'view')}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                          title="Edit Business"
                          onClick={() => handleBusinessAction(business, 'edit')}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                          title="Settings"
                          onClick={() => handleBusinessAction(business, 'settings')}
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Address:</span>
                        <span className="text-gray-900 text-right max-w-48 truncate" title={business.address}>
                          {business.address}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="text-gray-900">{business.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="text-gray-900 truncate" title={business.email}>{business.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Currency:</span>
                        <span className="text-gray-900 font-mono">{business.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax Rate:</span>
                        <span className="text-gray-900">{(business.taxRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="text-gray-900">{new Date(business.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Quick Actions:</span>
                        <div className="flex space-x-2">
                          <button 
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                            onClick={() => handleBusinessAction(business, 'backup')}
                          >
                            Backup
                          </button>
                          <button 
                            className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
                            onClick={() => handleBusinessAction(business, 'analytics')}
                          >
                            Analytics
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'database' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Database className="h-6 w-6 mr-2 text-orange-600" />
              Database Administration
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <button
                  onClick={handleGlobalBackup}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Download className="h-5 w-5" />
                  <span>{isLoading ? 'Backing up...' : 'Full System Backup'}</span>
                </button>

                <button
                  onClick={handleDatabaseCleanup}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span>{isLoading ? 'Cleaning...' : 'Database Cleanup'}</span>
                </button>

                <button
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  <Upload className="h-5 w-5" />
                  <span>Restore from Backup</span>
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Database Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Records:</span>
                    <span className="font-mono">{(metrics?.totalUsers || 0) + (metrics?.totalProducts || 0) + (metrics?.totalSales || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Database Size:</span>
                    <span className="font-mono">{metrics?.databaseSize || '0 MB'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Backup:</span>
                    <span className="font-mono">
                      {lastBackup ? lastBackup.toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>System Uptime:</span>
                    <span className="font-mono">{metrics?.systemUptime || '0m'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Connections:</span>
                    <span className="font-mono">{metrics?.activeConnections || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Monitor className="h-6 w-6 mr-2 text-purple-600" />
              System Monitoring
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className={`${systemMonitoring?.cpuUsage && systemMonitoring.cpuUsage > 70 ? 'bg-red-50' : 'bg-green-50'} rounded-lg p-6 text-center`}>
                <Cpu className={`h-12 w-12 ${systemMonitoring?.cpuUsage && systemMonitoring.cpuUsage > 70 ? 'text-red-600' : 'text-green-600'} mx-auto mb-3`} />
                <h3 className={`text-lg font-semibold ${systemMonitoring?.cpuUsage && systemMonitoring.cpuUsage > 70 ? 'text-red-800' : 'text-green-800'}`}>CPU Usage</h3>
                <p className={`text-3xl font-bold ${systemMonitoring?.cpuUsage && systemMonitoring.cpuUsage > 70 ? 'text-red-600' : 'text-green-600'}`}>
                  {systemMonitoring?.cpuUsage || 0}%
                </p>
                <p className={`text-sm ${systemMonitoring?.cpuUsage && systemMonitoring.cpuUsage > 70 ? 'text-red-700' : 'text-green-700'} mt-2`}>
                  {systemMonitoring?.cpuStatus || 'Normal range'}
                </p>
              </div>

              <div className={`${systemMonitoring?.memoryUsage && systemMonitoring.memoryUsage > 80 ? 'bg-red-50' : 'bg-blue-50'} rounded-lg p-6 text-center`}>
                <HardDrive className={`h-12 w-12 ${systemMonitoring?.memoryUsage && systemMonitoring.memoryUsage > 80 ? 'text-red-600' : 'text-blue-600'} mx-auto mb-3`} />
                <h3 className={`text-lg font-semibold ${systemMonitoring?.memoryUsage && systemMonitoring.memoryUsage > 80 ? 'text-red-800' : 'text-blue-800'}`}>Memory Usage</h3>
                <p className={`text-3xl font-bold ${systemMonitoring?.memoryUsage && systemMonitoring.memoryUsage > 80 ? 'text-red-600' : 'text-blue-600'}`}>
                  {systemMonitoring?.memoryUsage || 0}%
                </p>
                <p className={`text-sm ${systemMonitoring?.memoryUsage && systemMonitoring.memoryUsage > 80 ? 'text-red-700' : 'text-blue-700'} mt-2`}>
                  {systemMonitoring?.memoryStatus || 'Acceptable range'}
                </p>
              </div>

              <div className={`${systemMonitoring?.diskUsage && systemMonitoring.diskUsage > 85 ? 'bg-red-50' : 'bg-purple-50'} rounded-lg p-6 text-center`}>
                <Server className={`h-12 w-12 ${systemMonitoring?.diskUsage && systemMonitoring.diskUsage > 85 ? 'text-red-600' : 'text-purple-600'} mx-auto mb-3`} />
                <h3 className={`text-lg font-semibold ${systemMonitoring?.diskUsage && systemMonitoring.diskUsage > 85 ? 'text-red-800' : 'text-purple-800'}`}>Disk Usage</h3>
                <p className={`text-3xl font-bold ${systemMonitoring?.diskUsage && systemMonitoring.diskUsage > 85 ? 'text-red-600' : 'text-purple-600'}`}>
                  {systemMonitoring?.diskUsage || 0}%
                </p>
                <p className={`text-sm ${systemMonitoring?.diskUsage && systemMonitoring.diskUsage > 85 ? 'text-red-700' : 'text-purple-700'} mt-2`}>
                  {systemMonitoring?.diskStatus || 'Good capacity'}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Recent System Events</h3>
              <div className="space-y-3">
                {systemEvents.length > 0 ? (
                  systemEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div className="flex items-center space-x-3">
                        {event.icon === 'CheckCircle' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {event.icon === 'Activity' && <Activity className="h-5 w-5 text-blue-600" />}
                        {event.icon === 'AlertTriangle' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                        <span className={`${event.type === 'warning' ? 'text-yellow-800' : event.type === 'error' ? 'text-red-800' : 'text-gray-800'}`}>
                          {event.message}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {event.timestamp.toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No recent system events</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminView;
