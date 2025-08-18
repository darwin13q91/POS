import { useState, useEffect, useCallback } from 'react';
import { getDataManager, type DataEvent } from '../dynamic-data';
import { db } from '../database';
import type { Product, Sale, Customer, Category } from '../database';

// Hook for reactive data fetching with real-time updates
export function useDynamicData<T = unknown>(
  tableName: 'products' | 'sales' | 'customers' | 'categories',
  query?: (table: unknown) => Promise<T[]>
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const table = db[tableName];
      let result: T[];
      
      if (query) {
        result = await query(table);
      } else {
        result = (await table.toArray()) as T[];
      }
      
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error(`Error fetching ${tableName}:`, err);
    } finally {
      setLoading(false);
    }
  }, [tableName, query]);

  useEffect(() => {
    fetchData();

    // Listen for real-time updates
    const dataManager = getDataManager();
    if (dataManager) {
      const handleDataChange = (event: DataEvent) => {
        if (event.table === tableName) {
          // Refetch data when this table changes
          fetchData();
        }
      };

      dataManager.addEventListener(handleDataChange);
      
      return () => {
        dataManager.removeEventListener(handleDataChange);
      };
    }
  }, [fetchData, tableName]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh
  };
}

// Specific hooks for each data type
export function useProducts(query?: (table: unknown) => Promise<Product[]>) {
  return useDynamicData<Product>('products', query);
}

export function useSales(query?: (table: unknown) => Promise<Sale[]>) {
  return useDynamicData<Sale>('sales', query);
}

export function useCustomers(query?: (table: unknown) => Promise<Customer[]>) {
  return useDynamicData<Customer>('customers', query);
}

export function useCategories(query?: (table: unknown) => Promise<Category[]>) {
  return useDynamicData<Category>('categories', query);
}

// Hook for analytics with automatic refresh
export function useSalesAnalytics(timeRange?: { start: Date; end: Date }) {
  const [analytics, setAnalytics] = useState({
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    topProducts: [] as Array<{ name: string; quantity: number; revenue: number }>,
    salesByDay: [] as Array<{ date: string; sales: number; revenue: number }>
  });

  const { data: sales, loading } = useSales(
    timeRange 
      ? (table) => (table as { where: (field: string) => { between: (start: Date, end: Date) => { toArray: () => Promise<Sale[]> } } }).where('createdAt').between(timeRange.start, timeRange.end).toArray()
      : undefined
  );

  useEffect(() => {
    if (!loading && sales.length > 0) {
      // Calculate analytics
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
      const averageOrderValue = totalRevenue / totalSales;

      // Top products
      const productStats = new Map<string, { quantity: number; revenue: number }>();
      sales.forEach(sale => {
        sale.items.forEach(item => {
          const current = productStats.get(item.productName) || { quantity: 0, revenue: 0 };
          current.quantity += item.quantity;
          current.revenue += item.total;
          productStats.set(item.productName, current);
        });
      });

      const topProducts = Array.from(productStats.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Sales by day
      const salesByDay = new Map<string, { sales: number; revenue: number }>();
      sales.forEach(sale => {
        const date = sale.createdAt.toISOString().split('T')[0];
        const current = salesByDay.get(date) || { sales: 0, revenue: 0 };
        current.sales += 1;
        current.revenue += sale.total;
        salesByDay.set(date, current);
      });

      const salesByDayArray = Array.from(salesByDay.entries())
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setAnalytics({
        totalSales,
        totalRevenue,
        averageOrderValue,
        topProducts,
        salesByDay: salesByDayArray
      });
    }
  }, [sales, loading]);

  return { analytics, loading };
}
