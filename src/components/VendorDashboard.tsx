// Vendor Dashboard for POS System Owner
// Track customers who buy and use your POS system

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

// Types for customer tracking
interface POSCustomer {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  businessType: 'retail' | 'restaurant' | 'service' | 'other';
  
  // Subscription details
  subscriptionTier: 'starter' | 'professional' | 'enterprise';
  licenseType: 'one-time' | 'monthly' | 'annual';
  purchaseDate: Date;
  lastPaymentDate: Date;
  nextPaymentDate: Date;
  monthlyFee: number;
  totalPaid: number;
  
  // Usage analytics
  installationDate: Date;
  lastActiveDate: Date;
  userCount: number;
  dailyTransactions: number;
  monthlyTransactions: number;
  totalTransactions: number;
  
  // Support metrics
  supportTickets: number;
  lastSupportDate: Date;
  satisfactionScore: number; // 1-5
  
  // System info
  version: string;
  deviceType: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  
  // Health status
  status: 'active' | 'inactive' | 'trial' | 'churned' | 'overdue';
  healthScore: number; // 1-100
}

interface RevenueMetrics {
  totalCustomers: number;
  activeCustomers: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  averageRevenuePerUser: number;
  customerLifetimeValue: number;
  churnRate: number;
  customerAcquisitionCost: number;
  
  // Growth metrics
  newCustomersThisMonth: number;
  customersLostThisMonth: number;
  revenueGrowthRate: number;
  
  // Support metrics
  averageSupportTickets: number;
  averageSatisfactionScore: number;
}

// Mock data for demonstration
const generateMockCustomers = (): POSCustomer[] => [
  {
    id: '1',
    businessName: 'Joe\'s Coffee Shop',
    ownerName: 'Joe Martinez',
    email: 'joe@joescoffee.com',
    phone: '+1-555-0123',
    address: '123 Main St, Anytown, USA',
    businessType: 'restaurant',
    subscriptionTier: 'professional',
    licenseType: 'monthly',
    purchaseDate: new Date('2024-01-15'),
    lastPaymentDate: new Date('2024-08-01'),
    nextPaymentDate: new Date('2024-09-01'),
    monthlyFee: 49,
    totalPaid: 392, // 8 months * $49
    installationDate: new Date('2024-01-20'),
    lastActiveDate: new Date('2024-08-17'),
    userCount: 3,
    dailyTransactions: 125,
    monthlyTransactions: 3750,
    totalTransactions: 28500,
    supportTickets: 2,
    lastSupportDate: new Date('2024-07-15'),
    satisfactionScore: 5,
    version: '2.1.0',
    deviceType: 'Tablet (iPad)',
    location: {
      city: 'Anytown',
      state: 'California',
      country: 'USA'
    },
    status: 'active',
    healthScore: 95
  },
  {
    id: '2',
    businessName: 'Fashion Forward Boutique',
    ownerName: 'Sarah Chen',
    email: 'sarah@fashionforward.com',
    phone: '+1-555-0456',
    address: '456 Shopping Ave, Metro City, USA',
    businessType: 'retail',
    subscriptionTier: 'starter',
    licenseType: 'one-time',
    purchaseDate: new Date('2024-03-10'),
    lastPaymentDate: new Date('2024-03-10'),
    nextPaymentDate: new Date('2025-03-10'), // Annual support
    monthlyFee: 19, // Support only
    totalPaid: 218, // $199 license + $19 support
    installationDate: new Date('2024-03-15'),
    lastActiveDate: new Date('2024-08-16'),
    userCount: 2,
    dailyTransactions: 45,
    monthlyTransactions: 1350,
    totalTransactions: 6750,
    supportTickets: 0,
    lastSupportDate: new Date('2024-03-15'),
    satisfactionScore: 4,
    version: '2.0.5',
    deviceType: 'Desktop PC',
    location: {
      city: 'Metro City',
      state: 'New York',
      country: 'USA'
    },
    status: 'active',
    healthScore: 82
  }
  // Add more mock customers as needed
];

export const VendorDashboard: React.FC = () => {
  const [customers, setCustomers] = useState<POSCustomer[]>([]);
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<POSCustomer | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Load customer data (in real app, this would be from your backend)
    const mockCustomers = generateMockCustomers();
    setCustomers(mockCustomers);
    
    // Calculate metrics
    const activeCustomers = mockCustomers.filter(c => c.status === 'active');
    const totalMRR = activeCustomers.reduce((sum, c) => sum + c.monthlyFee, 0);
    const totalRevenue = mockCustomers.reduce((sum, c) => sum + c.totalPaid, 0);
    
    const calculatedMetrics: RevenueMetrics = {
      totalCustomers: mockCustomers.length,
      activeCustomers: activeCustomers.length,
      monthlyRecurringRevenue: totalMRR,
      annualRecurringRevenue: totalMRR * 12,
      averageRevenuePerUser: totalRevenue / mockCustomers.length,
      customerLifetimeValue: totalRevenue / mockCustomers.length * 2.5, // Estimated
      churnRate: 5, // 5% monthly churn
      customerAcquisitionCost: 150, // Estimated CAC
      newCustomersThisMonth: 8,
      customersLostThisMonth: 1,
      revenueGrowthRate: 15, // 15% monthly growth
      averageSupportTickets: mockCustomers.reduce((sum, c) => sum + c.supportTickets, 0) / mockCustomers.length,
      averageSatisfactionScore: mockCustomers.reduce((sum, c) => sum + c.satisfactionScore, 0) / mockCustomers.length
    };
    
    setMetrics(calculatedMetrics);
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const matchesFilter = filterStatus === 'all' || customer.status === filterStatus;
    const matchesSearch = customer.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (!metrics) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">POS Vendor Dashboard</h1>
      
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.monthlyRecurringRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{metrics.revenueGrowthRate}% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">+{metrics.newCustomersThisMonth} this month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Revenue Per User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.averageRevenuePerUser.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Customer lifetime value: ${metrics.customerLifetimeValue.toFixed(0)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.churnRate}%</div>
            <p className="text-xs text-muted-foreground">-{metrics.customersLostThisMonth} customers this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex gap-2">
          {['all', 'active', 'trial', 'overdue', 'churned'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-md text-sm ${
                filterStatus === status 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-1 border rounded-md"
        />
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Overview ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Business</th>
                  <th className="text-left p-2">Owner</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Plan</th>
                  <th className="text-left p-2">MRR</th>
                  <th className="text-left p-2">Total Paid</th>
                  <th className="text-left p-2">Transactions</th>
                  <th className="text-left p-2">Health</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr 
                    key={customer.id} 
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{customer.businessName}</div>
                        <div className="text-xs text-gray-500">{customer.location.city}, {customer.location.state}</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <div>{customer.ownerName}</div>
                        <div className="text-xs text-gray-500">{customer.email}</div>
                      </div>
                    </td>
                    <td className="p-2">{customer.businessType}</td>
                    <td className="p-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {customer.subscriptionTier}
                      </span>
                    </td>
                    <td className="p-2">${customer.monthlyFee}</td>
                    <td className="p-2">${customer.totalPaid}</td>
                    <td className="p-2">{customer.monthlyTransactions.toLocaleString()}/mo</td>
                    <td className="p-2">
                      <div className={`w-2 h-2 rounded-full inline-block mr-2 ${
                        customer.healthScore >= 90 ? 'bg-green-500' :
                        customer.healthScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      {customer.healthScore}%
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        customer.status === 'active' ? 'bg-green-100 text-green-800' :
                        customer.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                        customer.status === 'overdue' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="p-2">{customer.lastActiveDate.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{selectedCustomer.businessName}</h2>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><strong>Owner:</strong> {selectedCustomer.ownerName}</div>
                  <div><strong>Email:</strong> {selectedCustomer.email}</div>
                  <div><strong>Phone:</strong> {selectedCustomer.phone}</div>
                  <div><strong>Address:</strong> {selectedCustomer.address}</div>
                  <div><strong>Type:</strong> {selectedCustomer.businessType}</div>
                  <div><strong>Users:</strong> {selectedCustomer.userCount}</div>
                </CardContent>
              </Card>

              {/* Subscription Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><strong>Plan:</strong> {selectedCustomer.subscriptionTier}</div>
                  <div><strong>License:</strong> {selectedCustomer.licenseType}</div>
                  <div><strong>Monthly Fee:</strong> ${selectedCustomer.monthlyFee}</div>
                  <div><strong>Total Paid:</strong> ${selectedCustomer.totalPaid}</div>
                  <div><strong>Next Payment:</strong> {selectedCustomer.nextPaymentDate.toLocaleDateString()}</div>
                  <div><strong>Purchase Date:</strong> {selectedCustomer.purchaseDate.toLocaleDateString()}</div>
                </CardContent>
              </Card>

              {/* Usage Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Usage Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><strong>Daily Transactions:</strong> {selectedCustomer.dailyTransactions}</div>
                  <div><strong>Monthly Transactions:</strong> {selectedCustomer.monthlyTransactions.toLocaleString()}</div>
                  <div><strong>Total Transactions:</strong> {selectedCustomer.totalTransactions.toLocaleString()}</div>
                  <div><strong>Last Active:</strong> {selectedCustomer.lastActiveDate.toLocaleDateString()}</div>
                  <div><strong>Version:</strong> {selectedCustomer.version}</div>
                  <div><strong>Device:</strong> {selectedCustomer.deviceType}</div>
                </CardContent>
              </Card>

              {/* Support & Health */}
              <Card>
                <CardHeader>
                  <CardTitle>Support & Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><strong>Support Tickets:</strong> {selectedCustomer.supportTickets}</div>
                  <div><strong>Last Support:</strong> {selectedCustomer.lastSupportDate.toLocaleDateString()}</div>
                  <div><strong>Satisfaction:</strong> {selectedCustomer.satisfactionScore}/5 ⭐</div>
                  <div><strong>Health Score:</strong> 
                    <span className={`ml-2 font-bold ${
                      selectedCustomer.healthScore >= 90 ? 'text-green-500' :
                      selectedCustomer.healthScore >= 70 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {selectedCustomer.healthScore}%
                    </span>
                  </div>
                  <div><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      selectedCustomer.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedCustomer.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                      selectedCustomer.status === 'overdue' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedCustomer.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-6">
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Contact Customer
              </button>
              <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                Upgrade Plan
              </button>
              <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                Schedule Support
              </button>
              <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                View Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
