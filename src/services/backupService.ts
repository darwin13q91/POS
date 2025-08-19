import { db } from '../lib/database';
import type { Product, Sale, Customer, Category, Employee, AppUser, BusinessInfo, SystemConfig } from '../lib/database';

export interface BackupData {
  version: string;
  timestamp: Date;
  business: BusinessInfo[];
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  categories: Category[];
  employees: Employee[];
  users: AppUser[];
  systemConfigs: SystemConfig[];
}

export interface BackupOptions {
  includeProducts: boolean;
  includeSales: boolean;
  includeCustomers: boolean;
  includeEmployees: boolean;
  includeSystemSettings: boolean;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

export interface RestoreOptions {
  clearExisting: boolean;
  preserveUsers: boolean;
  preserveSystemSettings: boolean;
}

class BackupRestoreService {
  // Create full system backup
  async createBackup(options: Partial<BackupOptions> = {}): Promise<string> {
    try {
      const defaultOptions: BackupOptions = {
        includeProducts: true,
        includeSales: true,
        includeCustomers: true,
        includeEmployees: true,
        includeSystemSettings: true,
        ...options
      };

      const backupData: BackupData = {
        version: '1.0.0',
        timestamp: new Date(),
        business: [],
        products: [],
        sales: [],
        customers: [],
        categories: [],
        employees: [],
        users: [],
        systemConfigs: []
      };

      // Backup business info
      backupData.business = await db.businessInfo.toArray();

      // Backup products and categories
      if (defaultOptions.includeProducts) {
        backupData.products = await db.products.toArray();
        backupData.categories = await db.categories.toArray();
      }

      // Backup sales with date filtering
      if (defaultOptions.includeSales) {
        let salesQuery = db.sales.orderBy('createdAt');
        
        if (defaultOptions.dateRange) {
          const { startDate, endDate } = defaultOptions.dateRange;
          salesQuery = salesQuery.filter(sale => 
            sale.createdAt >= startDate && sale.createdAt <= endDate
          );
        }
        
        backupData.sales = await salesQuery.toArray();
      }

      // Backup customers
      if (defaultOptions.includeCustomers) {
        backupData.customers = await db.customers.toArray();
      }

      // Backup employees
      if (defaultOptions.includeEmployees) {
        backupData.employees = await db.employees.toArray();
      }

      // Backup system settings
      if (defaultOptions.includeSystemSettings) {
        backupData.users = await db.appUsers.toArray();
        backupData.systemConfigs = await db.systemConfigs.toArray();
      }

      // Convert to JSON string
      const backupJson = JSON.stringify(backupData, null, 2);
      
      console.log('Backup created successfully');
      return backupJson;

    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Download backup as file
  async downloadBackup(options?: Partial<BackupOptions>): Promise<void> {
    try {
      const backupData = await this.createBackup(options);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `pos-backup-${timestamp}.json`;

      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`Backup downloaded as ${filename}`);
    } catch (error) {
      console.error('Error downloading backup:', error);
      throw error;
    }
  }

  // Restore from backup data
  async restoreFromBackup(backupJson: string, options: Partial<RestoreOptions> = {}): Promise<void> {
    try {
      const defaultOptions: RestoreOptions = {
        clearExisting: true,
        preserveUsers: false,
        preserveSystemSettings: false,
        ...options
      };

      const backupData: BackupData = JSON.parse(backupJson);

      if (!this.validateBackupData(backupData)) {
        throw new Error('Invalid backup data format');
      }

      // Clear existing data if requested
      if (defaultOptions.clearExisting) {
        await this.clearDatabase(defaultOptions);
      }

      // Restore data in order to handle dependencies
      
      // 1. System configs first
      if (backupData.systemConfigs && backupData.systemConfigs.length > 0 && !defaultOptions.preserveSystemSettings) {
        await db.systemConfigs.bulkPut(backupData.systemConfigs);
        console.log(`Restored ${backupData.systemConfigs.length} system configs`);
      }

      // 2. Business info
      if (backupData.business && backupData.business.length > 0) {
        await db.businessInfo.bulkPut(backupData.business);
        console.log(`Restored ${backupData.business.length} business records`);
      }

      // 3. Users
      if (backupData.users && backupData.users.length > 0 && !defaultOptions.preserveUsers) {
        await db.appUsers.bulkPut(backupData.users);
        console.log(`Restored ${backupData.users.length} users`);
      }

      // 4. Categories (needed before products)
      if (backupData.categories && backupData.categories.length > 0) {
        await db.categories.bulkPut(backupData.categories);
        console.log(`Restored ${backupData.categories.length} categories`);
      }

      // 5. Products
      if (backupData.products && backupData.products.length > 0) {
        await db.products.bulkPut(backupData.products);
        console.log(`Restored ${backupData.products.length} products`);
      }

      // 6. Customers
      if (backupData.customers && backupData.customers.length > 0) {
        await db.customers.bulkPut(backupData.customers);
        console.log(`Restored ${backupData.customers.length} customers`);
      }

      // 7. Employees
      if (backupData.employees && backupData.employees.length > 0) {
        await db.employees.bulkPut(backupData.employees);
        console.log(`Restored ${backupData.employees.length} employees`);
      }

      // 8. Sales (last, as they depend on products and customers)
      if (backupData.sales && backupData.sales.length > 0) {
        // Convert date strings back to Date objects
        const salesWithDates = backupData.sales.map(sale => ({
          ...sale,
          createdAt: new Date(sale.createdAt)
        }));
        
        await db.sales.bulkPut(salesWithDates);
        console.log(`Restored ${backupData.sales.length} sales`);
      }

      console.log('Backup restored successfully');

    } catch (error) {
      console.error('Error restoring backup:', error);
      throw new Error(`Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Restore from uploaded file
  async restoreFromFile(file: File, options?: Partial<RestoreOptions>): Promise<void> {
    try {
      const text = await this.readFileAsText(file);
      await this.restoreFromBackup(text, options);
    } catch (error) {
      console.error('Error restoring from file:', error);
      throw error;
    }
  }

  // Validate backup data structure
  private validateBackupData(data: unknown): data is BackupData {
    if (!data || typeof data !== 'object') return false;
    
    const obj = data as Record<string, unknown>;
    
    return (
      typeof obj.version === 'string' &&
      obj.timestamp !== undefined &&
      Array.isArray(obj.business) &&
      Array.isArray(obj.products) &&
      Array.isArray(obj.sales) &&
      Array.isArray(obj.customers) &&
      Array.isArray(obj.categories) &&
      Array.isArray(obj.employees) &&
      Array.isArray(obj.users) &&
      Array.isArray(obj.systemConfigs)
    );
  }

  // Clear database tables
  private async clearDatabase(options: RestoreOptions): Promise<void> {
    try {
      // Clear in reverse dependency order
      await db.sales.clear();
      await db.employees.clear();
      await db.customers.clear();
      await db.products.clear();
      await db.categories.clear();
      
      if (!options.preserveUsers) {
        await db.appUsers.clear();
      }
      
      if (!options.preserveSystemSettings) {
        await db.systemConfigs.clear();
        await db.businessInfo.clear();
      }

      console.log('Database cleared for restore');
    } catch (error) {
      console.error('Error clearing database:', error);
      throw error;
    }
  }

  // Read file as text
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsText(file);
    });
  }

  // Auto backup scheduling
  async scheduleAutoBackup(intervalHours: number = 24): Promise<void> {
    try {
      // Clear any existing interval
      const existingInterval = localStorage.getItem('pos-backup-interval');
      if (existingInterval) {
        clearInterval(parseInt(existingInterval));
      }

      // Set up new interval
      const intervalId = setInterval(async () => {
        try {
          const backup = await this.createBackup();
          localStorage.setItem(`pos-auto-backup-${Date.now()}`, backup);
          
          // Keep only last 5 auto backups
          this.cleanupOldBackups();
          
          console.log('Auto backup created');
        } catch (error) {
          console.error('Auto backup failed:', error);
        }
      }, intervalHours * 60 * 60 * 1000);

      localStorage.setItem('pos-backup-interval', intervalId.toString());
      console.log(`Auto backup scheduled every ${intervalHours} hours`);
    } catch (error) {
      console.error('Error scheduling auto backup:', error);
      throw error;
    }
  }

  // Clean up old auto backups
  private cleanupOldBackups(): void {
    try {
      const backupKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('pos-auto-backup-')
      );

      if (backupKeys.length > 5) {
        // Sort by timestamp and remove oldest
        backupKeys
          .sort((a, b) => {
            const timeA = parseInt(a.split('-').pop() || '0');
            const timeB = parseInt(b.split('-').pop() || '0');
            return timeA - timeB;
          })
          .slice(0, backupKeys.length - 5)
          .forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
    }
  }

  // Get backup history
  getBackupHistory(): Array<{ key: string; timestamp: number; size: number }> {
    try {
      const backupKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('pos-auto-backup-')
      );

      return backupKeys.map(key => {
        const timestamp = parseInt(key.split('-').pop() || '0');
        const data = localStorage.getItem(key) || '';
        const size = new Blob([data]).size;
        
        return { key, timestamp, size };
      }).sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting backup history:', error);
      return [];
    }
  }

  // Restore from auto backup
  async restoreFromAutoBackup(backupKey: string, options?: Partial<RestoreOptions>): Promise<void> {
    try {
      const backupData = localStorage.getItem(backupKey);
      if (!backupData) {
        throw new Error('Auto backup not found');
      }

      await this.restoreFromBackup(backupData, options);
    } catch (error) {
      console.error('Error restoring from auto backup:', error);
      throw error;
    }
  }

  // Export data for migration
  async exportForMigration(): Promise<string> {
    try {
      const migrationData = {
        version: '1.0.0',
        exportType: 'migration',
        timestamp: new Date().toISOString(),
        data: await this.createBackup()
      };

      return JSON.stringify(migrationData, null, 2);
    } catch (error) {
      console.error('Error creating migration export:', error);
      throw error;
    }
  }

  // Get database statistics
  async getDatabaseStats(): Promise<{
    products: number;
    sales: number;
    customers: number;
    employees: number;
    categories: number;
    totalSize: number;
  }> {
    try {
      const [products, sales, customers, employees, categories] = await Promise.all([
        db.products.count(),
        db.sales.count(),
        db.customers.count(),
        db.employees.count(),
        db.categories.count()
      ]);

      // Estimate total size
      const backup = await this.createBackup();
      const totalSize = new Blob([backup]).size;

      return {
        products,
        sales,
        customers,
        employees,
        categories,
        totalSize
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {
        products: 0,
        sales: 0,
        customers: 0,
        employees: 0,
        categories: 0,
        totalSize: 0
      };
    }
  }
}

export const backupService = new BackupRestoreService();
