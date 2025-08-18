import { useState, useEffect } from 'react';
import { Code, Database, Zap, Bug, Settings, Download, Upload } from 'lucide-react';
import { db } from '../lib/database';
import { getMaintenanceService } from '../lib/remote-maintenance';

interface SystemInfo {
  userAgent: string;
  platform: string;
  language: string;
  cookieEnabled: boolean;
  onLine: boolean;
  memory: MemoryInfo | string;
  timing: PerformanceTiming;
  localStorage: {
    used: number;
    available: string;
  };
  timestamp: string;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface DatabaseStats {
  products: number;
  sales: number;
  customers: number;
  categories: number;
  tables: string[];
  version: number;
}

export default function DebugView() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState('system');

  useEffect(() => {
    loadSystemInfo();
    loadDatabaseStats();
    loadLogs();
  }, []);

  const loadSystemInfo = () => {
    const perfMemory = (performance as { memory?: MemoryInfo }).memory;
    const info: SystemInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      memory: perfMemory || 'Not available',
      timing: performance.timing,
      localStorage: {
        used: JSON.stringify(localStorage).length,
        available: 'Unknown'
      },
      timestamp: new Date().toISOString()
    };
    setSystemInfo(info);
  };

  const loadDatabaseStats = async () => {
    try {
      const stats = {
        products: await db.products.count(),
        sales: await db.sales.count(),
        customers: await db.customers.count(),
        categories: await db.categories.count(),
        tables: await db.tables.map(t => t.name),
        version: db.verno
      };
      setDbStats(stats);
    } catch (error) {
      console.error('Error loading database stats:', error);
    }
  };

  const loadLogs = () => {
    // Get logs from localStorage or maintenance service
    const maintenanceService = getMaintenanceService();
    if (maintenanceService) {
      // This would need to be implemented in the maintenance service
      setLogs(['System initialized', 'Database connected', 'Maintenance service active']);
    } else {
      setLogs(['System initialized', 'Database connected', 'Maintenance service not available']);
    }
  };

  const clearCache = () => {
    if (confirm('Clear all cache data? This will reload the page.')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  const exportData = async () => {
    try {
      const data = {
        products: await db.products.toArray(),
        sales: await db.sales.toArray(),
        customers: await db.customers.toArray(),
        categories: await db.categories.toArray(),
        timestamp: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pos-debug-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + error);
    }
  };

  const runDiagnostics = () => {
    const maintenanceService = getMaintenanceService();
    if (maintenanceService) {
      // This would trigger diagnostics in the maintenance service
      alert('Diagnostics triggered - check console for details');
      console.log('Running diagnostics...', maintenanceService.getSystemStatus());
    } else {
      alert('Maintenance service not available');
    }
  };

  const tabs = [
    { id: 'system', label: 'System Info', icon: Settings },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'logs', label: 'Logs', icon: Bug }
  ];

  return (
    <div className="flex-1 p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Code className="h-6 w-6 text-orange-600" />
            Developer Debug Console
          </h1>
          <p className="text-gray-600 mt-2">System diagnostics and development tools</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={runDiagnostics}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Run Diagnostics
          </button>
          <button
            onClick={exportData}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
          <button
            onClick={clearCache}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Clear Cache
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      selectedTab === tab.id
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {selectedTab === 'system' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">System Information</h3>
                {systemInfo && (
                  <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
                    {JSON.stringify(systemInfo, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {selectedTab === 'database' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Database Statistics</h3>
                {dbStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{dbStats.products}</div>
                      <div className="text-sm text-blue-800">Products</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{dbStats.sales}</div>
                      <div className="text-sm text-green-800">Sales</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{dbStats.customers}</div>
                      <div className="text-sm text-purple-800">Customers</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{dbStats.categories}</div>
                      <div className="text-sm text-orange-800">Categories</div>
                    </div>
                  </div>
                )}
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Database Tables</h4>
                  <pre className="bg-gray-100 p-4 rounded-lg text-sm">
                    {dbStats?.tables?.join('\n') || 'Loading...'}
                  </pre>
                </div>
              </div>
            )}

            {selectedTab === 'performance' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Performance Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Memory Usage</h4>
                    {systemInfo?.memory && typeof systemInfo.memory === 'object' && 'usedJSHeapSize' in systemInfo.memory ? (
                      <div className="space-y-1 text-sm">
                        <div>Used: {Math.round((systemInfo.memory as MemoryInfo).usedJSHeapSize / 1024 / 1024)}MB</div>
                        <div>Total: {Math.round((systemInfo.memory as MemoryInfo).totalJSHeapSize / 1024 / 1024)}MB</div>
                        <div>Limit: {Math.round((systemInfo.memory as MemoryInfo).jsHeapSizeLimit / 1024 / 1024)}MB</div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">Memory info not available</div>
                    )}
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Local Storage</h4>
                    <div className="space-y-1 text-sm">
                      <div>Used: {systemInfo?.localStorage?.used || 0} bytes</div>
                      <div>Available: {systemInfo?.localStorage?.available}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'logs' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">System Logs</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      [{new Date().toLocaleTimeString()}] {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
