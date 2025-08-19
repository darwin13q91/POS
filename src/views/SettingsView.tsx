import React, { useState, useEffect } from 'react';
import { Settings, Store, Database, Download, RefreshCw, Users } from 'lucide-react';
import { db } from '../lib/database';
import UserManagement from '../components/UserManagement';

const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('business');
  const [businessInfo, setBusinessInfo] = useState({
    name: 'Modern POS',
    address: '123 Main Street, City',
    phone: '(555) 123-4567',
    email: 'contact@modernpos.com',
    taxRate: '8'
  });
  
  const [systemSettings, setSystemSettings] = useState({
    currency: 'PHP',
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

  // Commented out unused functions to avoid TypeScript errors
  /*
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
  */

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

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'business', label: 'Business Info', icon: Store },
            { id: 'system', label: 'System Settings', icon: Settings },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'data', label: 'Data Management', icon: Database }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
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
        {activeTab === 'business' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>
              
              <div className="space-y-4">
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
              
              <div className="md:col-span-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={businessInfo.taxRate}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, taxRate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-xs"
                  />
                </div>
                
                <button
                  onClick={saveBusinessInfo}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Business Information
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={systemSettings.currency}
                    onChange={(e) => setSystemSettings({ ...systemSettings, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="PHP">PHP (₱) - Philippine Peso</option>
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
              </div>
              
              <div className="space-y-4">
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
              </div>
              
              <div className="md:col-span-2">
                <button
                  onClick={saveSystemSettings}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save System Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="p-6">
            <UserManagement />
          </div>
        )}

        {activeTab === 'data' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{dataStats.products}</div>
                <div className="text-sm text-gray-600">Products</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{dataStats.sales}</div>
                <div className="text-sm text-gray-600">Sales</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{dataStats.customers}</div>
                <div className="text-sm text-gray-600">Customers</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Export Data</h3>
                  <p className="text-sm text-gray-600">Download all data as JSON backup</p>
                </div>
                <button
                  onClick={exportData}
                  disabled={isExporting}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>{isExporting ? 'Exporting...' : 'Export'}</span>
                </button>
              </div>

              {lastBackup && (
                <div className="text-sm text-gray-600">
                  Last backup: {lastBackup.toLocaleString()}
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Reset Database</h3>
                  <p className="text-sm text-gray-600">Reset to default settings and sample data</p>
                </div>
                <button
                  onClick={resetToDefaults}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsView;
