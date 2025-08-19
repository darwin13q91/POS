import { db } from '../lib/database';
import type { Sale } from '../lib/database';

export interface SalesMetrics {
  totalRevenue: number;
  totalSales: number;
  averageOrderValue: number;
  topSellingProducts: ProductSalesData[];
  salesByPaymentMethod: PaymentMethodData[];
  salesTrend: SalesTrendData[];
  customerMetrics: CustomerMetrics;
}

export interface ProductSalesData {
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
  profit?: number;
}

export interface PaymentMethodData {
  method: 'cash' | 'card' | 'digital';
  count: number;
  total: number;
  percentage: number;
}

export interface SalesTrendData {
  date: string;
  sales: number;
  revenue: number;
  orders: number;
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  topCustomers: TopCustomerData[];
}

export interface TopCustomerData {
  customerId: number;
  customerName: string;
  totalSpent: number;
  totalOrders: number;
  lastPurchase: Date;
}

export interface ProductPerformance {
  productId: number;
  period: number;
  totalQuantity: number;
  totalRevenue: number;
  averagePrice: number;
  salesCount: number;
}

export interface InventoryInsights {
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalInventoryValue: number;
  averageProductPrice: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ReportFilters {
  dateRange?: DateRange;
  paymentMethod?: 'cash' | 'card' | 'digital';
  customerId?: number;
  productId?: number;
  categoryName?: string;
}

class AdvancedAnalyticsService {
  // Main dashboard metrics
  async getDashboardMetrics(filters?: ReportFilters): Promise<SalesMetrics> {
    try {
      const sales = await this.getFilteredSales(filters);
      
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
      const totalSales = sales.length;
      const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

      const topSellingProducts = await this.getTopSellingProducts(filters);
      const salesByPaymentMethod = await this.getSalesByPaymentMethod(filters);
      const salesTrend = await this.getSalesTrend(filters);
      const customerMetrics = await this.getCustomerMetrics(filters);

      return {
        totalRevenue,
        totalSales,
        averageOrderValue,
        topSellingProducts,
        salesByPaymentMethod,
        salesTrend,
        customerMetrics
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      return this.getEmptyMetrics();
    }
  }

  // Sales filtering
  async getFilteredSales(filters?: ReportFilters): Promise<Sale[]> {
    try {
      let sales = await db.sales.toArray();

      if (filters?.dateRange) {
        sales = sales.filter(sale => 
          sale.createdAt >= filters.dateRange!.startDate && 
          sale.createdAt <= filters.dateRange!.endDate
        );
      }

      if (filters?.paymentMethod) {
        sales = sales.filter(sale => sale.paymentMethod === filters.paymentMethod);
      }

      if (filters?.customerId) {
        sales = sales.filter(sale => sale.customerId === filters.customerId);
      }

      return sales;
    } catch (error) {
      console.error('Error filtering sales:', error);
      return [];
    }
  }

  // Top selling products
  async getTopSellingProducts(filters?: ReportFilters, limit: number = 10): Promise<ProductSalesData[]> {
    try {
      const sales = await this.getFilteredSales(filters);
      const productStats: { [productId: number]: ProductSalesData } = {};

      // Aggregate sales by product
      for (const sale of sales) {
        for (const item of sale.items) {
          if (!productStats[item.productId]) {
            productStats[item.productId] = {
              productId: item.productId,
              productName: item.productName,
              quantitySold: 0,
              revenue: 0
            };
          }
          productStats[item.productId].quantitySold += item.quantity;
          productStats[item.productId].revenue += item.total;
        }
      }

      // Sort by revenue and limit
      return Object.values(productStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top selling products:', error);
      return [];
    }
  }

  // Sales by payment method
  async getSalesByPaymentMethod(filters?: ReportFilters): Promise<PaymentMethodData[]> {
    try {
      const sales = await this.getFilteredSales(filters);
      const paymentStats: { [method: string]: { count: number; total: number } } = {};

      sales.forEach(sale => {
        if (!paymentStats[sale.paymentMethod]) {
          paymentStats[sale.paymentMethod] = { count: 0, total: 0 };
        }
        paymentStats[sale.paymentMethod].count += 1;
        paymentStats[sale.paymentMethod].total += sale.total;
      });

      const totalAmount = Object.values(paymentStats).reduce((sum, stat) => sum + stat.total, 0);

      return Object.entries(paymentStats).map(([method, stat]) => ({
        method: method as 'cash' | 'card' | 'digital',
        count: stat.count,
        total: stat.total,
        percentage: totalAmount > 0 ? (stat.total / totalAmount) * 100 : 0
      }));
    } catch (error) {
      console.error('Error getting sales by payment method:', error);
      return [];
    }
  }

  // Sales trend analysis
  async getSalesTrend(filters?: ReportFilters, groupBy: 'day' | 'week' | 'month' = 'day'): Promise<SalesTrendData[]> {
    try {
      const sales = await this.getFilteredSales(filters);
      const trendData: { [key: string]: { sales: number; revenue: number; orders: number } } = {};

      sales.forEach(sale => {
        const dateKey = this.getDateKey(sale.createdAt, groupBy);
        
        if (!trendData[dateKey]) {
          trendData[dateKey] = { sales: 0, revenue: 0, orders: 0 };
        }
        
        trendData[dateKey].sales += sale.items.reduce((sum, item) => sum + item.quantity, 0);
        trendData[dateKey].revenue += sale.total;
        trendData[dateKey].orders += 1;
      });

      return Object.entries(trendData)
        .map(([date, data]) => ({
          date,
          ...data
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error getting sales trend:', error);
      return [];
    }
  }

  // Customer analytics
  async getCustomerMetrics(filters?: ReportFilters): Promise<CustomerMetrics> {
    try {
      const sales = await this.getFilteredSales(filters);
      const customers = await db.customers.toArray();

      const customerStats: { [customerId: number]: TopCustomerData } = {};
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Process sales to get customer metrics
      sales.forEach(sale => {
        if (sale.customerId) {
          if (!customerStats[sale.customerId]) {
            const customer = customers.find(c => c.id === sale.customerId);
            customerStats[sale.customerId] = {
              customerId: sale.customerId,
              customerName: customer?.name || 'Unknown Customer',
              totalSpent: 0,
              totalOrders: 0,
              lastPurchase: sale.createdAt
            };
          }
          
          customerStats[sale.customerId].totalSpent += sale.total;
          customerStats[sale.customerId].totalOrders += 1;
          
          if (sale.createdAt > customerStats[sale.customerId].lastPurchase) {
            customerStats[sale.customerId].lastPurchase = sale.createdAt;
          }
        }
      });

      const topCustomers = Object.values(customerStats)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      const newCustomers = customers.filter(customer => 
        customer.createdAt >= thirtyDaysAgo
      ).length;

      const returningCustomers = Object.values(customerStats).filter(stat => 
        stat.totalOrders > 1
      ).length;

      return {
        totalCustomers: customers.length,
        newCustomers,
        returningCustomers,
        topCustomers
      };
    } catch (error) {
      console.error('Error getting customer metrics:', error);
      return {
        totalCustomers: 0,
        newCustomers: 0,
        returningCustomers: 0,
        topCustomers: []
      };
    }
  }

  // Product performance analysis
  async getProductPerformance(productId: number, period: number = 30): Promise<ProductPerformance> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      const sales = await this.getFilteredSales({
        dateRange: { startDate, endDate: new Date() }
      });

      const productSales = sales.flatMap(sale => 
        sale.items.filter(item => item.productId === productId)
      );

      const totalQuantity = productSales.reduce((sum, item) => sum + item.quantity, 0);
      const totalRevenue = productSales.reduce((sum, item) => sum + item.total, 0);
      const averagePrice = totalQuantity > 0 ? totalRevenue / totalQuantity : 0;

      return {
        productId,
        period,
        totalQuantity,
        totalRevenue,
        averagePrice,
        salesCount: productSales.length
      };
    } catch (error) {
      console.error('Error getting product performance:', error);
      return {
        productId,
        period,
        totalQuantity: 0,
        totalRevenue: 0,
        averagePrice: 0,
        salesCount: 0
      };
    }
  }

  // Export reports
  async exportSalesReport(filters?: ReportFilters): Promise<string> {
    try {
      const metrics = await this.getDashboardMetrics(filters);
      const sales = await this.getFilteredSales(filters);

      const report = {
        generatedAt: new Date().toISOString(),
        filters,
        summary: {
          totalRevenue: metrics.totalRevenue,
          totalSales: metrics.totalSales,
          averageOrderValue: metrics.averageOrderValue
        },
        topProducts: metrics.topSellingProducts,
        paymentMethods: metrics.salesByPaymentMethod,
        customerMetrics: metrics.customerMetrics,
        detailedSales: sales.map(sale => ({
          id: sale.id,
          date: sale.createdAt,
          total: sale.total,
          paymentMethod: sale.paymentMethod,
          items: sale.items.length,
          customerId: sale.customerId
        }))
      };

      return JSON.stringify(report, null, 2);
    } catch (error) {
      console.error('Error exporting sales report:', error);
      throw error;
    }
  }

  // Inventory insights
  async getInventoryInsights(): Promise<InventoryInsights> {
    try {
      const products = await db.products.toArray();
      
      const lowStockThreshold = parseInt(await db.getSystemConfig('low_stock_threshold') || '10');
      
      const insights = {
        totalProducts: products.length,
        lowStockItems: products.filter(p => p.stock <= lowStockThreshold).length,
        outOfStockItems: products.filter(p => p.stock === 0).length,
        totalInventoryValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
        averageProductPrice: products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0
      };

      return insights;
    } catch (error) {
      console.error('Error getting inventory insights:', error);
      return {
        totalProducts: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalInventoryValue: 0,
        averageProductPrice: 0
      };
    }
  }

  // Helper methods
  private getDateKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
    const d = new Date(date);
    
    switch (groupBy) {
      case 'day':
        return d.toISOString().split('T')[0];
      case 'week': {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return weekStart.toISOString().split('T')[0];
      }
      case 'month':
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      default:
        return d.toISOString().split('T')[0];
    }
  }

  private getEmptyMetrics(): SalesMetrics {
    return {
      totalRevenue: 0,
      totalSales: 0,
      averageOrderValue: 0,
      topSellingProducts: [],
      salesByPaymentMethod: [],
      salesTrend: [],
      customerMetrics: {
        totalCustomers: 0,
        newCustomers: 0,
        returningCustomers: 0,
        topCustomers: []
      }
    };
  }
}

export const analyticsService = new AdvancedAnalyticsService();
