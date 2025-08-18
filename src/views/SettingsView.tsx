import React, { useState, useEffect } from 'react';
import { Settings, Store, Database, Wifi, Download, Trash2, RefreshCw } from 'lucide-react';
import { db } from '../lib/database';

const SettingsView: React.FC = () => {
  const [businessInfo, setBusinessInfo] = useState({
    name: 'Modern POS',
    address: '123 Main Street, City',
    phone: '(555) 123-4567',
    email: 'contact@modernpos.com',
    taxRate: '8'
  });
  
  const [systemSettings, setSystemSettings] = useState({
    currency: 'USD',
    theme: 'light',
    receiptPrinter: 'default',
    lowStockThreshold: '10'
  });

  const [dataStats, setDataStats] = useState({
    products: 0,
    sales: 0,
    customers: 0
  });

  const [isExporting, setIsExporting] = useState(false);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);

  useEffect(() => {
    loadDataStats();
    loadSettings();
  }, []);

  const loadDataStats = async () => {
    try {
      const products = await db.products.count();
      const sales = await db.sales.count();
      const customers = await db.customers.count();
      
      setDataStats({ products, sales, customers });
    } catch (error) {
      console.error('Failed to load data stats:', error);
    }
  };

  const loadSettings = () => {
    // Load settings from localStorage
    const savedBusinessInfo = localStorage.getItem('pos-business-info');
    if (savedBusinessInfo) {
      setBusinessInfo(JSON.parse(savedBusinessInfo));
    }

    const savedSystemSettings = localStorage.getItem('pos-system-settings');
    if (savedSystemSettings) {
      setSystemSettings(JSON.parse(savedSystemSettings));
    }

    const savedLastBackup = localStorage.getItem('pos-last-backup');
    if (savedLastBackup) {
      setLastBackup(new Date(savedLastBackup));
    }
  };

  const saveBusinessInfo = () => {
    localStorage.setItem('pos-business-info', JSON.stringify(businessInfo));
    alert('Business information saved successfully!');
  };

  const saveSystemSettings = () => {
    localStorage.setItem('pos-system-settings', JSON.stringify(systemSettings));
    alert('System settings saved successfully!');
  };

  const exportData = async () => {
    setIsExporting(true);
    try {
      const products = await db.products.toArray();
      const sales = await db.sales.toArray();
      const customers = await db.customers.toArray();
      const categories = await db.categories.toArray();

      const exportData = {
        timestamp: new Date().toISOString(),
        data: {
          products,
          sales,
          customers,
          categories
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pos-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const now = new Date();
      setLastBackup(now);
      localStorage.setItem('pos-last-backup', now.toISOString());
      
      alert('Data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        await db.clearAllData();
        await loadDataStats();
        alert('All data cleared successfully!');
      } catch (error) {
        console.error('Failed to clear data:', error);
        alert('Failed to clear data. Please try again.');
      }
    }
  };

  const loadBusinessTemplate = async (businessType: 'carDealership' | 'coffeeShop' | 'restaurant' | 'convenienceStore') => {
    if (window.confirm(`Load ${businessType} template? This will replace current data.`)) {
      try {
        const { loadBusinessTemplate: getTemplate } = await import('../lib/business-templates');
        const template = getTemplate(businessType);
        
        // Clear existing data
        await db.clearAllData();
        
        // Load template data
        await db.categories.bulkAdd(template.categories.map(cat => ({
          ...cat,
          createdAt: new Date()
        })));
        
        await db.products.bulkAdd(template.products.map(product => ({
          ...product,
          createdAt: new Date(),
          updatedAt: new Date()
        })));
        
        // Update business info
        setBusinessInfo(template.businessInfo);
        localStorage.setItem('pos-business-info', JSON.stringify(template.businessInfo));
        
        await loadDataStats();
        alert(`${businessType} template loaded successfully!`);
      } catch (error) {
        console.error('Failed to load template:', error);
        alert('Failed to load template. Please try again.');
      }
    }
  };

  const resetToDefaults = async () => {
    if (window.confirm('Reset to default settings and sample data?')) {
      try {
        await db.clearAllData();
        await db.addSampleData();
        await loadDataStats();
        
        // Reset settings
        setBusinessInfo({
          name: 'Modern POS',
          address: '123 Main Street, City',
          phone: '(555) 123-4567',
          email: 'contact@modernpos.com',
          taxRate: '8'
        });
        
        setSystemSettings({
          currency: 'USD',
          theme: 'light',
          receiptPrinter: 'default',
          lowStockThreshold: '10'
        });

        localStorage.removeItem('pos-business-info');
        localStorage.removeItem('pos-system-settings');
        
        alert('System reset to defaults successfully!');
      } catch (error) {
        console.error('Failed to reset system:', error);
        alert('Failed to reset system. Please try again.');
      }
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure your POS system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <Store className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input
                type="text"
                value={businessInfo.name}
                onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={businessInfo.address}
                onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={businessInfo.phone}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={businessInfo.email}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={businessInfo.taxRate}
                onChange={(e) => setBusinessInfo({ ...businessInfo, taxRate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={saveBusinessInfo}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Business Information
            </button>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">System Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={systemSettings.currency}
                onChange={(e) => setSystemSettings({ ...systemSettings, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (C$)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <select
                value={systemSettings.theme}
                onChange={(e) => setSystemSettings({ ...systemSettings, theme: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Printer</label>
              <select
                value={systemSettings.receiptPrinter}
                onChange={(e) => setSystemSettings({ ...systemSettings, receiptPrinter: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="default">Default Printer</option>
                <option value="thermal">Thermal Printer</option>
                <option value="none">No Printer</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
              <input
                type="number"
                value={systemSettings.lowStockThreshold}
                onChange={(e) => setSystemSettings({ ...systemSettings, lowStockThreshold: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={saveSystemSettings}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save System Settings
            </button>
          </div>
        </div>

        {/* Data Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Data Overview</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{dataStats.products}</div>
              <div className="text-sm text-gray-600">Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{dataStats.sales}</div>
              <div className="text-sm text-gray-600">Sales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{dataStats.customers}</div>
              <div className="text-sm text-gray-600">Customers</div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={exportData}
              disabled={isExporting}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? 'Exporting...' : 'Export Data'}</span>
            </button>
            
            {lastBackup && (
              <div className="text-xs text-gray-500 text-center">
                Last backup: {lastBackup.toLocaleDateString()} at {lastBackup.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Business Templates */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <Store className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Business Templates</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Quickly configure your POS for different business types with pre-loaded products and settings.
          </p>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => loadBusinessTemplate('carDealership')}
              className="p-4 border border-gray-300 rounded-lg text-center hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <div className="text-2xl mb-2">🚗</div>
              <div className="font-medium text-sm">Car Dealership</div>
            </button>
            
            <button
              onClick={() => loadBusinessTemplate('coffeeShop')}
              className="p-4 border border-gray-300 rounded-lg text-center hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <div className="text-2xl mb-2">☕</div>
              <div className="font-medium text-sm">Coffee Shop</div>
            </button>
            
            <button
              onClick={() => loadBusinessTemplate('restaurant')}
              className="p-4 border border-gray-300 rounded-lg text-center hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <div className="text-2xl mb-2">🍽️</div>
              <div className="font-medium text-sm">Restaurant</div>
            </button>
            
            <button
              onClick={() => loadBusinessTemplate('convenienceStore')}
              className="p-4 border border-gray-300 rounded-lg text-center hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <div className="text-2xl mb-2">🏪</div>
              <div className="font-medium text-sm">Convenience Store</div>
            </button>
          </div>
        </div>

        {/* System Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <Wifi className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">System Actions</h2>
          </div>
          
          <div className="space-y-3">
            <button
              id="pwa-install-button"
              style={{ display: 'none' }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Install App</span>
            </button>
            
            <button
              onClick={resetToDefaults}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset to Defaults</span>
            </button>
            
            <button
              onClick={clearAllData}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear All Data</span>
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Application Status</h3>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Database:</span>
                <span className="text-green-600">Connected</span>
              </div>
              <div className="flex justify-between">
                <span>Network:</span>
                <span className={navigator.onLine ? 'text-green-600' : 'text-red-600'}>
                  {navigator.onLine ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>PWA:</span>
                <span className="text-green-600">Active</span>
              </div>
              <div className="flex justify-between">
                <span>Version:</span>
                <span>1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
