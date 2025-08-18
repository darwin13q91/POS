import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Calendar, BarChart3, PieChart, Users } from 'lucide-react';
import { db, type Sale } from '../lib/database';

interface DailySales {
  date: string;
  revenue: number;
  transactions: number;
}

interface PaymentMethodStats {
  method: string;
  count: number;
  percentage: number;
  amount: number;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

const AnalyticsView: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('today');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const allSales = await db.sales.orderBy('createdAt').reverse().toArray();
      
      // Filter sales based on time range
      const now = new Date();
      const filteredSales = allSales.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        switch (timeRange) {
          case 'today':
            return saleDate.toDateString() === now.toDateString();
          case 'week': {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return saleDate >= weekAgo;
          }
          case 'month': {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return saleDate >= monthAgo;
          }
          case 'year': {
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            return saleDate >= yearAgo;
          }
          default:
            return true;
        }
      });

      setSales(filteredSales);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calculateMetrics = () => {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTransactions = sales.length;
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const totalItems = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

    return {
      totalRevenue,
      totalTransactions,
      averageOrderValue,
      totalItems
    };
  };

  const getDailySales = (): DailySales[] => {
    const salesByDate: { [key: string]: { revenue: number; transactions: number } } = {};
    
    sales.forEach(sale => {
      const date = new Date(sale.createdAt).toDateString();
      if (!salesByDate[date]) {
        salesByDate[date] = { revenue: 0, transactions: 0 };
      }
      salesByDate[date].revenue += sale.total;
      salesByDate[date].transactions += 1;
    });

    return Object.entries(salesByDate)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getPaymentMethodStats = (): PaymentMethodStats[] => {
    const paymentStats: { [key: string]: { count: number; amount: number } } = {};
    
    sales.forEach(sale => {
      if (!paymentStats[sale.paymentMethod]) {
        paymentStats[sale.paymentMethod] = { count: 0, amount: 0 };
      }
      paymentStats[sale.paymentMethod].count += 1;
      paymentStats[sale.paymentMethod].amount += sale.total;
    });

    const totalTransactions = sales.length;
    return Object.entries(paymentStats).map(([method, data]) => ({
      method,
      count: data.count,
      amount: data.amount,
      percentage: totalTransactions > 0 ? (data.count / totalTransactions) * 100 : 0
    }));
  };

  const getTopProducts = (): TopProduct[] => {
    const productStats: { [key: string]: { quantity: number; revenue: number } } = {};
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const productName = item.productId?.toString() || 'Unknown Product';
        if (!productStats[productName]) {
          productStats[productName] = { quantity: 0, revenue: 0 };
        }
        productStats[productName].quantity += item.quantity;
        productStats[productName].revenue += item.price * item.quantity;
      });
    });

    return Object.entries(productStats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(e.target.value as 'today' | 'week' | 'month' | 'year');
  };

  const metrics = calculateMetrics();
  const dailySales = getDailySales();
  const paymentMethodStats = getPaymentMethodStats();
  const topProducts = getTopProducts();

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
            <p className="text-gray-600">Track your business performance and trends</p>
          </div>
          <select
            value={timeRange}
            onChange={handleTimeRangeChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">${metrics.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">Revenue from {sales.length} transactions</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.totalTransactions}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <Calendar className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-blue-600">Total completed orders</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-purple-600">${metrics.averageOrderValue.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
              <span className="text-purple-600">Average per transaction</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Items Sold</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.totalItems}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <PieChart className="h-4 w-4 text-orange-500 mr-1" />
              <span className="text-orange-600">Total items purchased</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daily Sales Chart */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Sales Trend</h3>
            {dailySales.length > 0 ? (
              <div className="space-y-3">
                {dailySales.slice(-7).map((day, index) => {
                  const maxRevenue = Math.max(...dailySales.map(d => d.revenue));
                  const percentage = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-20 text-sm text-gray-600 flex-shrink-0">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-200 rounded-full h-4 relative overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-16 text-right text-sm font-medium text-gray-900">
                        ${day.revenue.toFixed(0)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No sales data available</p>
            )}
          </div>

          {/* Top Products */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
            {topProducts.length > 0 ? (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.quantity} units sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${product.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No product data available</p>
            )}
          </div>

          {/* Payment Methods */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
            {paymentMethodStats.length > 0 ? (
              <div className="space-y-4">
                {paymentMethodStats.map((method, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                      <span className="font-medium text-gray-900 capitalize">{method.method}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">${method.amount.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">{method.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No payment data available</p>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
            {sales.length > 0 ? (
              <div className="space-y-3">
                {sales.slice(0, 5).map((sale, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">${sale.total.toFixed(2)}</p>
                      <p className="text-sm text-gray-500 capitalize">{sale.paymentMethod}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No transactions available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
