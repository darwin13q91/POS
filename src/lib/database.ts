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
}

export class POSDatabase extends Dexie {
  products!: Table<Product>;
  sales!: Table<Sale>;
  customers!: Table<Customer>;
  categories!: Table<Category>;

  constructor() {
    super('POSDatabase');
    
    this.version(1).stores({
      products: '++id, name, category, sku, barcode, createdAt',
      sales: '++id, createdAt, status, customerId, cashierId',
      customers: '++id, name, email, phone, createdAt',
      categories: '++id, name, createdAt'
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
  }

  // Helper methods
  async addSampleData() {
    const now = new Date();
    
    const categories: Omit<Category, 'id'>[] = [
      { name: 'Electronics', description: 'Electronic devices and accessories', color: '#3b82f6', createdAt: now },
      { name: 'Clothing', description: 'Apparel and fashion items', color: '#ef4444', createdAt: now },
      { name: 'Food & Beverage', description: 'Food and drink items', color: '#10b981', createdAt: now },
      { name: 'Books', description: 'Books and educational materials', color: '#f59e0b', createdAt: now },
      { name: 'Home & Garden', description: 'Home improvement and garden items', color: '#8b5cf6', createdAt: now }
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
  }
}

// Initialize database with sample data
export const initializeDatabase = async () => {
  try {
    await db.open();
    
    // Check if data already exists
    const productCount = await db.products.count();
    if (productCount === 0) {
      // Add sample data
      await db.transaction('rw', db.products, db.categories, db.customers, async () => {
        // Categories
        await db.categories.bulkAdd(sampleCategories);
        
        // Products
        await db.products.bulkAdd(sampleProducts);
        
        // Sample customers
        const sampleCustomers: Customer[] = [
          {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1-555-0101',
            address: '123 Main St, Anytown, USA',
            notes: 'Regular customer, prefers cash payments',
            totalPurchases: 245.67,
            lastPurchase: new Date('2024-01-10'),
            createdAt: new Date('2023-12-01'),
            updatedAt: new Date('2024-01-10')
          },
          {
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+1-555-0102',
            address: '456 Oak Ave, Somewhere, USA',
            notes: 'Business customer, needs invoices',
            totalPurchases: 1205.45,
            lastPurchase: new Date('2024-01-08'),
            createdAt: new Date('2023-11-15'),
            updatedAt: new Date('2024-01-08')
          },
          {
            name: 'Bob Johnson',
            email: 'bob@example.com',
            phone: '+1-555-0103',
            address: '789 Pine Rd, Elsewhere, USA',
            totalPurchases: 89.99,
            lastPurchase: new Date('2023-12-28'),
            createdAt: new Date('2023-12-20'),
            updatedAt: new Date('2023-12-28')
          }
        ];
        
        await db.customers.bulkAdd(sampleCustomers);
        
        console.log('Database initialized with sample data');
      });
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
};

export const db = new POSDatabase();

// Sample data for initial setup
const sampleCategories: Category[] = [
  { name: 'Electronics', description: 'Electronic devices and accessories', color: '#3b82f6', createdAt: new Date() },
  { name: 'Food & Beverage', description: 'Food and drink items', color: '#10b981', createdAt: new Date() },
  { name: 'Clothing', description: 'Apparel and fashion items', color: '#f59e0b', createdAt: new Date() },
  { name: 'Home & Garden', description: 'Home improvement and garden supplies', color: '#ef4444', createdAt: new Date() }
];

const sampleProducts: Product[] = [
  {
    name: 'Wireless Headphones',
    price: 79.99,
    category: 'Electronics',
    sku: 'WH-001',
    stock: 25,
    description: 'High-quality wireless Bluetooth headphones',
    barcode: '123456789012',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Coffee Beans (1kg)',
    price: 24.99,
    category: 'Food & Beverage',
    sku: 'CB-001',
    stock: 50,
    description: 'Premium arabica coffee beans',
    barcode: '123456789013',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Cotton T-Shirt',
    price: 19.99,
    category: 'Clothing',
    sku: 'CT-001',
    stock: 100,
    description: '100% organic cotton t-shirt',
    barcode: '123456789014',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Garden Shovel',
    price: 34.99,
    category: 'Home & Garden',
    sku: 'GS-001',
    stock: 15,
    description: 'Durable steel garden shovel',
    barcode: '123456789015',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Smartphone Case',
    price: 12.99,
    category: 'Electronics',
    sku: 'SC-001',
    stock: 75,
    description: 'Protective smartphone case',
    barcode: '123456789016',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Initialize with sample data if database is empty
db.open().then(async () => {
  const productCount = await db.products.count();
  if (productCount === 0) {
    await db.addSampleData();
  }
});
