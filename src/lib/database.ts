import Dexie from 'dexie';
import type { Table } from 'dexie';

export interface Product {
  id?: number;
  name: string;
  price: number;
  category: string;
  sku: string;
  stock: number;
  description?: string;
  image?: string;
  barcode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id?: number;
  items: SaleItem[];
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  customerId?: number;
  cashierId: string;
  createdAt: Date;
  status: 'completed' | 'pending' | 'refunded';
}

export interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Customer {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  totalPurchases: number;
  lastPurchase?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id?: number;
  name: string;
  description?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Payroll Interfaces
export interface Employee {
  id?: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  position: string;
  department: string;
  hireDate: Date;
  hourlyRate: number;
  salary?: number;
  payType: 'hourly' | 'salary';
  status: 'active' | 'inactive' | 'terminated';
  taxId: string;
  bankAccountNumber?: string;
  routingNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntry {
  id?: number;
  employeeId: number;
  date: Date;
  clockIn: Date;
  clockOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  status: 'clocked_in' | 'on_break' | 'clocked_out';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollPeriod {
  id?: number;
  startDate: Date;
  endDate: Date;
  payDate: Date;
  status: 'draft' | 'processing' | 'paid' | 'closed';
  totalGrossPay: number;
  totalNetPay: number;
  totalTaxes: number;
  totalDeductions: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollRecord {
  id?: number;
  payrollPeriodId: number;
  employeeId: number;
  regularHours: number;
  overtimeHours: number;
  grossPay: number;
  federalTax: number;
  stateTax: number;
  socialSecurityTax: number;
  medicareTax: number;
  otherDeductions: number;
  netPay: number;
  status: 'draft' | 'approved' | 'paid';
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollSettings {
  id?: number;
  companyName: string;
  federalTaxRate: number;
  stateTaxRate: number;
  socialSecurityRate: number;
  medicareRate: number;
  overtimeMultiplier: number;
  payFrequency: 'weekly' | 'biweekly' | 'monthly' | 'semimonthly';
  updatedAt: Date;
}

// System Configuration Interfaces
export interface SystemConfig {
  id?: number;
  key: string;
  value: string;
  description: string;
  category: 'app' | 'business' | 'ui' | 'feature';
  type: 'string' | 'number' | 'boolean' | 'json';
  isEditable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePermission {
  id?: number;
  role: 'staff' | 'manager' | 'owner' | 'developer' | 'support' | 'superadmin';
  module: string;
  actions: string;
  description: string;
  createdAt: Date;
}

export interface BusinessInfo {
  id?: number;
  businessId: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  timezone: string;
  currency: string;
  taxRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppUser {
  id?: number;
  userId: string;
  username: string;
  email: string;
  role: 'staff' | 'manager' | 'owner' | 'developer' | 'support' | 'superadmin';
  businessId: string;
  passwordHash: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
  lastPasswordChange?: Date;
  loginAttempts?: number;
  lockedUntil?: Date;
  updatedAt: Date;
}

export interface LoyaltyProgram {
  id?: number;
  name: string;
  description: string;
  pointsPerDollar: number;
  minimumPurchase: number;
  rewardThresholds: RewardThreshold[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RewardThreshold {
  points: number;
  reward: string;
  discountType: 'percentage' | 'fixed' | 'free_item';
  discountValue: number;
  description: string;
}

export interface CustomerLoyalty {
  id?: number;
  customerId: number;
  programId: number;
  totalPoints: number;
  pointsUsed: number;
  pointsAvailable: number;
  tier: string;
  joinDate: Date;
  lastActivity: Date;
}

export interface LoyaltyTransaction {
  id?: number;
  customerId: number;
  saleId?: number;
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  points: number;
  description: string;
  createdAt: Date;
}

export class POSDatabase extends Dexie {
  products!: Table<Product>;
  sales!: Table<Sale>;
  customers!: Table<Customer>;
  categories!: Table<Category>;
  employees!: Table<Employee>;
  timeEntries!: Table<TimeEntry>;
  payrollPeriods!: Table<PayrollPeriod>;
  payrollRecords!: Table<PayrollRecord>;
  payrollSettings!: Table<PayrollSettings>;
  systemConfigs!: Table<SystemConfig>;
  rolePermissions!: Table<RolePermission>;
  businessInfo!: Table<BusinessInfo>;
  appUsers!: Table<AppUser>;
  loyaltyPrograms!: Table<LoyaltyProgram>;
  customerLoyalty!: Table<CustomerLoyalty>;
  loyaltyTransactions!: Table<LoyaltyTransaction>;

  constructor() {
    super('POSDatabase');
    
    this.version(3).stores({
      products: '++id, name, category, sku, barcode, price, cost, stock, description, isActive, categoryId, createdAt, updatedAt',
      sales: '++id, createdAt, updatedAt, status, customerId, cashierId, total, items, customerInfo, paymentMethod, date',
      customers: '++id, name, firstName, lastName, email, phone, address, notes, totalSpent, totalPurchases, lastPurchase, isActive, createdAt, updatedAt',
      categories: '++id, name, description, color, createdAt, updatedAt',
      employees: '++id, employeeId, firstName, lastName, email, position, department, hourlyRate, hireDate, status, isActive, emergencyContact, createdAt, updatedAt',
      timeEntries: '++id, employeeId, date, clockIn, clockOut, breakStart, breakEnd, totalHours, status, createdAt, updatedAt',
      payrollPeriods: '++id, startDate, endDate, payDate, status, totalGrossPay, totalNetPay, totalTaxes, totalDeductions, createdAt, updatedAt',
      payrollRecords: '++id, payrollPeriodId, employeeId, regularHours, overtimeHours, grossPay, federalTax, stateTax, socialSecurityTax, medicareTax, otherDeductions, netPay, status, createdAt, updatedAt',
      payrollSettings: '++id, companyName, federalTaxRate, stateTaxRate, socialSecurityRate, medicareRate, overtimeMultiplier, payFrequency, updatedAt',
      systemConfigs: '++id, key, value, description, category, type, isEditable, createdAt, updatedAt',
      rolePermissions: '++id, role, module, actions, description, createdAt',
      businessInfo: '++id, businessId, name, description, address, phone, email, website, logo, timezone, currency, taxRate, createdAt, updatedAt',
      appUsers: '++id, userId, username, email, role, businessId, passwordHash, isActive, lastLogin, lastPasswordChange, loginAttempts, lockedUntil, createdAt, updatedAt',
      loyaltyPrograms: '++id, name, description, pointsPerDollar, minimumPurchase, isActive, createdAt, updatedAt',
      customerLoyalty: '++id, customerId, programId, totalPoints, pointsUsed, pointsAvailable, tier, joinDate, lastActivity',
      loyaltyTransactions: '++id, customerId, saleId, type, points, description, createdAt'
    });
    
    this.products.hook('creating', function(_primKey, obj) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.products.hook('updating', function(modifications) {
      Object.assign(modifications, { updatedAt: new Date() });
    });

    this.sales.hook('creating', function(_primKey, obj) {
      obj.createdAt = new Date();
    });

    this.customers.hook('creating', function(_primKey, obj) {
      obj.createdAt = new Date();
    });

    this.categories.hook('creating', function(_primKey, obj) {
      obj.createdAt = new Date();
    });

    // Payroll hooks
    this.employees.hook('creating', function(_primKey, obj) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.employees.hook('updating', function(modifications) {
      Object.assign(modifications, { updatedAt: new Date() });
    });

    this.timeEntries.hook('creating', function(_primKey, obj) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.timeEntries.hook('updating', function(modifications) {
      Object.assign(modifications, { updatedAt: new Date() });
    });

    this.payrollPeriods.hook('creating', function(_primKey, obj) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.payrollPeriods.hook('updating', function(modifications) {
      Object.assign(modifications, { updatedAt: new Date() });
    });

    this.payrollRecords.hook('creating', function(_primKey, obj) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.payrollRecords.hook('updating', function(modifications) {
      Object.assign(modifications, { updatedAt: new Date() });
    });

    this.payrollSettings.hook('creating', function(_primKey, obj) {
      obj.updatedAt = new Date();
    });

    this.payrollSettings.hook('updating', function(modifications) {
      Object.assign(modifications, { updatedAt: new Date() });
    });

    // System config hooks
    this.systemConfigs.hook('creating', function(_primKey, obj) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.systemConfigs.hook('updating', function(modifications) {
      Object.assign(modifications, { updatedAt: new Date() });
    });

    // Role permission hooks
    this.rolePermissions.hook('creating', function(_primKey, obj) {
      obj.createdAt = new Date();
    });

    // Business info hooks
    this.businessInfo.hook('creating', function(_primKey, obj) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.businessInfo.hook('updating', function(modifications) {
      Object.assign(modifications, { updatedAt: new Date() });
    });

    // App users hooks
    this.appUsers.hook('creating', function(_primKey, obj) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.appUsers.hook('updating', function(modifications) {
      Object.assign(modifications, { updatedAt: new Date() });
    });
  }

  // Initialize with default data including configuration
  async initializeWithDefaultData() {
    try {
      await db.transaction('rw', [
        db.categories,
        db.products,
        db.customers,
        db.systemConfigs,
        db.rolePermissions,
        db.businessInfo,
        db.appUsers
      ], async () => {
        // Initialize system configuration
        await this.seedSystemConfigs();
        
        // Initialize role permissions
        await this.seedRolePermissions();
        
        // Initialize business info
        await this.seedBusinessInfo();
        
        // Initialize app users
        await this.seedAppUsers();
        
        // Initialize sample data if empty
        const categoryCount = await db.categories.count();
        if (categoryCount === 0) {
          await this.seedSampleCategories();
        }

        const productCount = await db.products.count();
        if (productCount === 0) {
          await this.seedSampleProducts();
        }

        const customerCount = await db.customers.count();
        if (customerCount === 0) {
          await this.seedSampleCustomers();
        }
        
        console.log('Database initialized with default data');
      });
    } catch (error) {
      console.error('Error initializing database with default data:', error);
      throw error;
    }
  }

  private async seedSystemConfigs() {
    const now = new Date();
    const configs = [
      {
        key: 'company_name',
        value: 'POS System',
        description: 'Company name displayed in receipts and reports',
        category: 'business' as const,
        type: 'string' as const,
        isEditable: true,
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'tax_rate',
        value: '0.10',
        description: 'Default tax rate (decimal format)',
        category: 'business' as const,
        type: 'number' as const,
        isEditable: true,
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'currency_symbol',
        value: '₱',
        description: 'Currency symbol for display (Philippine Peso)',
        category: 'business' as const,
        type: 'string' as const,
        isEditable: true,
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'currency_code',
        value: 'PHP',
        description: 'Currency code (Philippine Peso)',
        category: 'business' as const,
        type: 'string' as const,
        isEditable: true,
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'receipt_footer',
        value: 'Thank you for your business!',
        description: 'Footer text on receipts',
        category: 'business' as const,
        type: 'string' as const,
        isEditable: true,
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'low_stock_threshold',
        value: '10',
        description: 'Alert when stock falls below this number',
        category: 'feature' as const,
        type: 'number' as const,
        isEditable: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    await db.systemConfigs.bulkAdd(configs);
  }

  private async seedRolePermissions() {
    const now = new Date();
    const permissions = [
      // SuperAdmin permissions (System Creator/CEO)
      { role: 'superadmin' as const, module: 'system', actions: 'all', description: 'Ultimate system control', createdAt: now },
      { role: 'superadmin' as const, module: 'users', actions: 'all', description: 'Manage all users across businesses', createdAt: now },
      { role: 'superadmin' as const, module: 'reports', actions: 'all', description: 'Access all system reports', createdAt: now },
      { role: 'superadmin' as const, module: 'inventory', actions: 'all', description: 'Global inventory management', createdAt: now },
      { role: 'superadmin' as const, module: 'sales', actions: 'all', description: 'Global sales oversight', createdAt: now },
      { role: 'superadmin' as const, module: 'customers', actions: 'all', description: 'Global customer management', createdAt: now },
      { role: 'superadmin' as const, module: 'payroll', actions: 'all', description: 'Global payroll management', createdAt: now },
      { role: 'superadmin' as const, module: 'business', actions: 'all', description: 'Manage multiple businesses', createdAt: now },
      { role: 'superadmin' as const, module: 'licensing', actions: 'all', description: 'Manage system licensing', createdAt: now },

      // Owner permissions
      { role: 'owner' as const, module: 'system', actions: 'all', description: 'Full system access', createdAt: now },
      { role: 'owner' as const, module: 'users', actions: 'create,read,update,delete', description: 'User management', createdAt: now },
      { role: 'owner' as const, module: 'reports', actions: 'read,export', description: 'View all reports', createdAt: now },
      { role: 'owner' as const, module: 'inventory', actions: 'create,read,update,delete', description: 'Inventory management', createdAt: now },
      { role: 'owner' as const, module: 'sales', actions: 'create,read,update,delete', description: 'Sales processing', createdAt: now },
      { role: 'owner' as const, module: 'customers', actions: 'create,read,update,delete', description: 'Customer management', createdAt: now },
      { role: 'owner' as const, module: 'payroll', actions: 'create,read,update,delete', description: 'Payroll management', createdAt: now },

      // Manager permissions
      { role: 'manager' as const, module: 'reports', actions: 'read,export', description: 'View reports', createdAt: now },
      { role: 'manager' as const, module: 'inventory', actions: 'create,read,update,delete', description: 'Inventory management', createdAt: now },
      { role: 'manager' as const, module: 'sales', actions: 'create,read,update,delete', description: 'Sales processing', createdAt: now },
      { role: 'manager' as const, module: 'customers', actions: 'create,read,update,delete', description: 'Customer management', createdAt: now },
      { role: 'manager' as const, module: 'payroll', actions: 'read,update', description: 'View payroll data', createdAt: now },

      // Support permissions
      { role: 'support' as const, module: 'system', actions: 'read', description: 'View system status', createdAt: now },
      { role: 'support' as const, module: 'users', actions: 'read,update', description: 'Help with user issues', createdAt: now },
      { role: 'support' as const, module: 'reports', actions: 'read', description: 'View system reports', createdAt: now },
      { role: 'support' as const, module: 'inventory', actions: 'read', description: 'View inventory for support', createdAt: now },
      { role: 'support' as const, module: 'sales', actions: 'read', description: 'View sales for support', createdAt: now },
      { role: 'support' as const, module: 'customers', actions: 'read,update', description: 'Customer support', createdAt: now },

      // Staff permissions
      { role: 'staff' as const, module: 'sales', actions: 'create,read', description: 'Process sales', createdAt: now },
      { role: 'staff' as const, module: 'customers', actions: 'create,read,update', description: 'Customer service', createdAt: now },
      { role: 'staff' as const, module: 'inventory', actions: 'read', description: 'View inventory', createdAt: now }
    ];

    await db.rolePermissions.bulkAdd(permissions);
  }

  private async seedBusinessInfo() {
    const now = new Date();
    const businessData = [
      {
        businessId: 'pos-default-001',
        name: 'Modern POS System',
        description: 'A modern point of sale system',
        address: '123 Business St, City, State 12345',
        phone: '+1 (555) 123-4567',
        email: 'info@modernpos.com',
        website: 'https://modernpos.com',
        timezone: 'America/New_York',
        currency: 'USD',
        taxRate: 0.10,
        createdAt: now,
        updatedAt: now
      }
    ];

    await db.businessInfo.bulkAdd(businessData);
  }

  private async seedAppUsers() {
    const now = new Date();
    
    // Simple hash function to match auth.ts (for demo purposes)
    const hashPassword = (password: string): string => {
      let hash = 0;
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(36);
    };
    
    const users = [
      {
        userId: 'superadmin-001',
        username: 'superadmin',
        email: 'superadmin@pos.com',
        role: 'superadmin' as const,
        businessId: 'pos-global-system',
        passwordHash: hashPassword('password13!ED'), // Ultimate system admin password
        isActive: true,
        loginAttempts: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        userId: 'admin-001',
        username: 'admin',
        email: 'admin@pos.com',
        role: 'owner' as const,
        businessId: 'pos-default-001',
        passwordHash: hashPassword('Admin@2025!'), // Secure admin password
        isActive: true,
        loginAttempts: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        userId: 'manager-001',
        username: 'manager',
        email: 'manager@pos.com',
        role: 'manager' as const,
        businessId: 'pos-default-001',
        passwordHash: hashPassword('Manager@2025!'), // Secure manager password
        isActive: true,
        loginAttempts: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        userId: 'cashier-001',
        username: 'cashier',
        email: 'cashier@pos.com',
        role: 'staff' as const,
        businessId: 'pos-default-001',
        passwordHash: hashPassword('Cashier@2025!'), // Secure cashier password
        isActive: true,
        loginAttempts: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        userId: 'staff-001',
        username: 'staff',
        email: 'staff@pos.com',
        role: 'staff' as const,
        businessId: 'pos-default-001',
        passwordHash: hashPassword('Staff@2025!'), // Secure staff password
        isActive: true,
        loginAttempts: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        userId: 'support-001',
        username: 'support',
        email: 'support@pos.com',
        role: 'support' as const,
        businessId: 'pos-default-001',
        passwordHash: hashPassword('Support@2025!'), // Support user password
        isActive: true,
        loginAttempts: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        userId: 'vendor-001',
        username: 'vendor',
        email: 'vendor@pos.com',
        role: 'staff' as const,
        businessId: 'pos-default-001',
        passwordHash: hashPassword('Vendor@2025!'), // Vendor/seller password
        isActive: true,
        loginAttempts: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        userId: 'demo-001',
        username: 'demo',
        email: 'demo@pos.com',
        role: 'staff' as const,
        businessId: 'pos-default-001',
        passwordHash: hashPassword('demo123'), // Simple demo password for testing
        isActive: true,
        loginAttempts: 0,
        createdAt: now,
        updatedAt: now
      }
    ];

    await db.appUsers.bulkAdd(users);
  }

  private async seedSampleCategories() {
    const now = new Date();
    const categories = [
      { name: 'Electronics', description: 'Electronic devices and accessories', color: '#3b82f6', createdAt: now, updatedAt: now },
      { name: 'Clothing', description: 'Apparel and fashion items', color: '#ef4444', createdAt: now, updatedAt: now },
      { name: 'Food & Beverage', description: 'Food and drink items', color: '#10b981', createdAt: now, updatedAt: now },
      { name: 'Books', description: 'Books and educational materials', color: '#f59e0b', createdAt: now, updatedAt: now },
      { name: 'Home & Garden', description: 'Home improvement and garden items', color: '#8b5cf6', createdAt: now, updatedAt: now }
    ];

    await db.categories.bulkAdd(categories);
  }

  private async seedSampleProducts() {
    const now = new Date();
    const products = [
      {
        name: 'Wireless Headphones',
        price: 99.99,
        category: 'Electronics',
        sku: 'WH001',
        stock: 50,
        description: 'High-quality wireless headphones with noise cancellation',
        barcode: '1234567890123',
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Coffee Mug',
        price: 12.99,
        category: 'Food & Beverage',
        sku: 'MUG001',
        stock: 100,
        description: 'Ceramic coffee mug with heat retention',
        barcode: '1234567890124',
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'T-Shirt',
        price: 24.99,
        category: 'Clothing',
        sku: 'TS001',
        stock: 75,
        description: 'Cotton t-shirt in various sizes',
        barcode: '1234567890125',
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Programming Book',
        price: 49.99,
        category: 'Books',
        sku: 'BK001',
        stock: 25,
        description: 'Learn modern web development',
        barcode: '1234567890126',
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Plant Pot',
        price: 18.99,
        category: 'Home & Garden',
        sku: 'PP001',
        stock: 40,
        description: 'Decorative ceramic plant pot',
        barcode: '1234567890127',
        createdAt: now,
        updatedAt: now
      }
    ];

    await db.products.bulkAdd(products);
  }

  private async seedSampleCustomers() {
    const now = new Date();
    const customers = [
      {
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1-555-0101',
        address: '123 Main St, Anytown, USA',
        notes: 'Regular customer, prefers cash payments',
        totalPurchases: 245.67,
        totalSpent: 245.67,
        lastPurchase: new Date('2024-01-10'),
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Jane Smith',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '+1-555-0102',
        address: '456 Oak Ave, Somewhere, USA',
        notes: 'Business customer, needs invoices',
        totalPurchases: 1205.45,
        totalSpent: 1205.45,
        lastPurchase: new Date('2024-01-08'),
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Bob Johnson',
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob@example.com',
        phone: '+1-555-0103',
        address: '789 Pine Rd, Elsewhere, USA',
        totalPurchases: 89.99,
        totalSpent: 89.99,
        lastPurchase: new Date('2023-12-28'),
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    await db.customers.bulkAdd(customers);
  }

  // Legacy method for backward compatibility
  async addSampleData() {
    const now = new Date();
    
    const categories: Omit<Category, 'id'>[] = [
      { name: 'Electronics', description: 'Electronic devices and accessories', color: '#3b82f6', createdAt: now, updatedAt: now },
      { name: 'Clothing', description: 'Apparel and fashion items', color: '#ef4444', createdAt: now, updatedAt: now },
      { name: 'Food & Beverage', description: 'Food and drink items', color: '#10b981', createdAt: now, updatedAt: now },
      { name: 'Books', description: 'Books and educational materials', color: '#f59e0b', createdAt: now, updatedAt: now },
      { name: 'Home & Garden', description: 'Home improvement and garden items', color: '#8b5cf6', createdAt: now, updatedAt: now }
    ];

    const products: Omit<Product, 'id'>[] = [
      {
        name: 'Wireless Headphones',
        price: 99.99,
        category: 'Electronics',
        sku: 'WH001',
        stock: 50,
        description: 'High-quality wireless headphones with noise cancellation',
        barcode: '1234567890123',
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Coffee Mug',
        price: 12.99,
        category: 'Food & Beverage',
        sku: 'MUG001',
        stock: 100,
        description: 'Ceramic coffee mug with heat retention',
        barcode: '1234567890124',
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'T-Shirt',
        price: 24.99,
        category: 'Clothing',
        sku: 'TS001',
        stock: 75,
        description: 'Cotton t-shirt in various sizes',
        barcode: '1234567890125',
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Programming Book',
        price: 49.99,
        category: 'Books',
        sku: 'BK001',
        stock: 25,
        description: 'Learn modern web development',
        barcode: '1234567890126',
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Plant Pot',
        price: 18.99,
        category: 'Home & Garden',
        sku: 'PP001',
        stock: 40,
        description: 'Decorative ceramic plant pot',
        barcode: '1234567890127',
        createdAt: now,
        updatedAt: now
      }
    ];

    await this.categories.bulkAdd(categories);
    await this.products.bulkAdd(products);
    
    console.log('Sample data added successfully!');
  }

  async clearAllData() {
    await this.products.clear();
    await this.sales.clear();
    await this.customers.clear();
    await this.categories.clear();
    await this.systemConfigs.clear();
    await this.rolePermissions.clear();
    await this.businessInfo.clear();
    await this.appUsers.clear();
  }

  // Configuration management methods
  async getSystemConfig(key: string): Promise<string | null> {
    const config = await this.systemConfigs.where('key').equals(key).first();
    return config?.value || null;
  }

  async setSystemConfig(key: string, value: string, description?: string, type: 'string' | 'number' | 'boolean' = 'string', category: 'app' | 'business' | 'ui' | 'feature' = 'app') {
    const existing = await this.systemConfigs.where('key').equals(key).first();
    if (existing) {
      await this.systemConfigs.update(existing.id!, { value, description, type, category, updatedAt: new Date() });
    } else {
      await this.systemConfigs.add({ 
        key, 
        value, 
        description: description || '', 
        type, 
        category,
        isEditable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  async getRolePermissions(role: 'staff' | 'manager' | 'owner' | 'developer' | 'support' | 'superadmin'): Promise<RolePermission[]> {
    return await this.rolePermissions.where('role').equals(role).toArray();
  }

  async hasPermission(role: 'staff' | 'manager' | 'owner' | 'developer' | 'support' | 'superadmin', module: string, action: string): Promise<boolean> {
    const rolePermission = await this.rolePermissions
      .where('role')
      .equals(role)
      .and(p => p.module === module)
      .first();
    
    return rolePermission?.actions.includes(action) === true;
  }

  async getBusinessInfo(): Promise<BusinessInfo | null> {
    return await this.businessInfo.toCollection().first() || null;
  }

  async setBusinessInfo(data: Partial<BusinessInfo>) {
    const existing = await this.businessInfo.toCollection().first();
    if (existing) {
      await this.businessInfo.update(existing.id!, { ...data, updatedAt: new Date() });
    } else {
      await this.businessInfo.add({ 
        businessId: 'pos-default-001',
        name: 'Modern POS System',
        timezone: 'America/New_York',
        currency: 'USD',
        taxRate: 0.10,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data
      });
    }
  }

  // User management methods
  async getUserByUsername(username: string): Promise<AppUser | null> {
    return await this.appUsers.where('username').equals(username).first() || null;
  }

  async updateUserLastLogin(userId: string) {
    const user = await this.appUsers.where('userId').equals(userId).first();
    if (user?.id) {
      await this.appUsers.update(user.id, { 
        lastLogin: new Date(), 
        loginAttempts: 0,
        updatedAt: new Date()
      });
    }
  }

  async incrementLoginAttempts(userId: string) {
    const user = await this.appUsers.where('userId').equals(userId).first();
    if (user?.id) {
      const attempts = (user.loginAttempts || 0) + 1;
      const shouldLock = attempts >= 5;
      
      await this.appUsers.update(user.id, { 
        loginAttempts: attempts,
        lockedUntil: shouldLock ? new Date(Date.now() + 30 * 60 * 1000) : undefined,
        updatedAt: new Date()
      });
    }
  }
}

// Initialize database with comprehensive data
export const initializeDatabase = async () => {
  try {
    await db.open();
    
    // Check if configuration already exists
    const configCount = await db.systemConfigs.count();
    if (configCount === 0) {
      console.log('Initializing database with default configuration and data...');
      await db.initializeWithDefaultData();
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
};

export const db = new POSDatabase();

// Initialize with comprehensive data if database is empty
db.open().then(async () => {
  try {
    const configCount = await db.systemConfigs.count();
    if (configCount === 0) {
      console.log('Database appears to be empty, initializing with default data...');
      await db.initializeWithDefaultData();
    } else {
      console.log('Database already initialized with configuration data');
    }
  } catch (error) {
    console.error('Error checking or initializing database:', error);
    // Try to initialize anyway if there's an error
    try {
      await db.initializeWithDefaultData();
    } catch (initError) {
      console.error('Failed to initialize database:', initError);
    }
  }
}).catch(error => {
  console.error('Failed to open database:', error);
});
