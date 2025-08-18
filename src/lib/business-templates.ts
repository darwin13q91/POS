// Business-specific sample data templates
import type { Product, Category } from './database';

// 🚗 CAR DEALERSHIP TEMPLATE
export const carDealershipData = {
  businessInfo: {
    name: 'Premium Auto Sales',
    address: '456 Auto Row, Car City, CA 90210',
    phone: '(555) AUTO-CAR',
    email: 'sales@premiumauto.com',
    taxRate: '8.25' // CA sales tax
  },
  
  categories: [
    { name: 'New Vehicles', description: 'Brand new cars and trucks', color: '#3b82f6' },
    { name: 'Used Vehicles', description: 'Pre-owned vehicles', color: '#10b981' },
    { name: 'Parts & Service', description: 'Auto parts and service', color: '#f59e0b' },
    { name: 'Accessories', description: 'Vehicle accessories', color: '#ef4444' },
    { name: 'Financing', description: 'Financing and insurance products', color: '#8b5cf6' }
  ] as Omit<Category, 'id' | 'createdAt'>[],
  
  products: [
    {
      name: '2024 Honda Civic LX',
      price: 28500.00,
      category: 'New Vehicles',
      sku: 'CIVIC-LX-2024',
      stock: 5,
      description: '4-door sedan, CVT, 32 city/42 highway MPG',
      barcode: 'VIN: 1HGFC2F59PH123456'
    },
    {
      name: '2023 Honda Accord EX',
      price: 32900.00,
      category: 'New Vehicles', 
      sku: 'ACCORD-EX-2023',
      stock: 3,
      description: '4-door sedan, turbo engine, leather seats',
      barcode: 'VIN: 1HGCV1F13NA654321'
    },
    {
      name: '2021 Toyota Camry LE',
      price: 22800.00,
      category: 'Used Vehicles',
      sku: 'CAMRY-USED-2021',
      stock: 2,
      description: 'Pre-owned, 25K miles, excellent condition',
      barcode: 'VIN: 4T1G11AK5MU456789'
    },
    {
      name: 'Extended Warranty',
      price: 2500.00,
      category: 'Financing',
      sku: 'WARRANTY-EXT',
      stock: 100,
      description: '5-year/100K mile extended warranty',
      barcode: 'WARR-EXT-001'
    }
  ] as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]
};

// ☕ COFFEE SHOP TEMPLATE
export const coffeeShopData = {
  businessInfo: {
    name: 'Brew & Bytes Café',
    address: '123 Coffee Street, Brew City, NY 10001',
    phone: '(555) BREW-NOW',
    email: 'hello@brewbytes.com',
    taxRate: '8' // NY sales tax
  },
  
  categories: [
    { name: 'Hot Drinks', description: 'Coffee, tea, hot chocolate', color: '#8b4513' },
    { name: 'Cold Drinks', description: 'Iced coffee, smoothies, sodas', color: '#4169e1' },
    { name: 'Pastries', description: 'Fresh baked goods', color: '#ffd700' },
    { name: 'Sandwiches', description: 'Fresh made sandwiches', color: '#32cd32' },
    { name: 'Merchandise', description: 'Coffee beans, mugs, apparel', color: '#ff6347' }
  ] as Omit<Category, 'id' | 'createdAt'>[],
  
  products: [
    {
      name: 'Americano',
      price: 4.50,
      category: 'Hot Drinks',
      sku: 'AMER-12OZ',
      stock: 100,
      description: 'Espresso with hot water, 12oz',
      barcode: 'COFFEE-001'
    },
    {
      name: 'Cappuccino',
      price: 5.25,
      category: 'Hot Drinks',
      sku: 'CAPP-12OZ',
      stock: 100,
      description: 'Espresso with steamed milk foam, 12oz',
      barcode: 'COFFEE-002'
    },
    {
      name: 'Iced Latte',
      price: 5.75,
      category: 'Cold Drinks',
      sku: 'LATTE-ICED',
      stock: 100,
      description: 'Espresso with cold milk over ice, 16oz',
      barcode: 'COFFEE-003'
    },
    {
      name: 'Croissant',
      price: 3.50,
      category: 'Pastries',
      sku: 'CROIS-BUTTER',
      stock: 24,
      description: 'Fresh butter croissant',
      barcode: 'PASTRY-001'
    },
    {
      name: 'Breakfast Sandwich',
      price: 8.95,
      category: 'Sandwiches',
      sku: 'SAND-BREAK',
      stock: 15,
      description: 'Egg, cheese, bacon on English muffin',
      barcode: 'SANDWICH-001'
    }
  ] as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]
};

// 🍽️ RESTAURANT TEMPLATE
export const restaurantData = {
  businessInfo: {
    name: "Mario's Italian Bistro",
    address: '789 Little Italy, Food City, IL 60601',
    phone: '(555) PASTA-GO',
    email: 'info@mariositalian.com',
    taxRate: '9.25' // Chicago tax rate
  },
  
  categories: [
    { name: 'Appetizers', description: 'Starters and small plates', color: '#ff6b6b' },
    { name: 'Pasta', description: 'Traditional Italian pasta dishes', color: '#4ecdc4' },
    { name: 'Pizza', description: 'Wood-fired pizzas', color: '#45b7d1' },
    { name: 'Main Courses', description: 'Meat and seafood entrees', color: '#f9ca24' },
    { name: 'Desserts', description: 'Sweet endings', color: '#f0932b' },
    { name: 'Beverages', description: 'Drinks and wine', color: '#eb4d4b' }
  ] as Omit<Category, 'id' | 'createdAt'>[],
  
  products: [
    {
      name: 'Caesar Salad',
      price: 14.95,
      category: 'Appetizers',
      sku: 'CAESAR-SALAD',
      stock: 50,
      description: 'Romaine lettuce, croutons, parmesan, caesar dressing',
      barcode: 'FOOD-001'
    },
    {
      name: 'Spaghetti Carbonara',
      price: 22.95,
      category: 'Pasta',
      sku: 'SPAG-CARB',
      stock: 30,
      description: 'Spaghetti with pancetta, egg, and parmesan',
      barcode: 'FOOD-002'
    },
    {
      name: 'Margherita Pizza',
      price: 18.95,
      category: 'Pizza',
      sku: 'PIZZA-MARG',
      stock: 25,
      description: 'Fresh mozzarella, basil, san marzano tomatoes',
      barcode: 'FOOD-003'
    },
    {
      name: 'Osso Buco',
      price: 34.95,
      category: 'Main Courses',
      sku: 'OSSO-BUCO',
      stock: 8,
      description: 'Braised veal shank with risotto milanese',
      barcode: 'FOOD-004'
    },
    {
      name: 'Tiramisu',
      price: 9.95,
      category: 'Desserts',
      sku: 'TIRAMISU',
      stock: 12,
      description: 'Classic Italian dessert with espresso',
      barcode: 'FOOD-005'
    }
  ] as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]
};

// 🏪 CONVENIENCE STORE TEMPLATE
export const convenienceStoreData = {
  businessInfo: {
    name: '24/7 Quick Mart',
    address: '321 Main Street, Anytown, TX 75001',
    phone: '(555) QUICK-24',
    email: 'manager@quickmart24.com',
    taxRate: '8.25' // TX sales tax
  },
  
  categories: [
    { name: 'Snacks', description: 'Chips, candy, nuts', color: '#ff9f43' },
    { name: 'Beverages', description: 'Sodas, water, energy drinks', color: '#70a1ff' },
    { name: 'Tobacco', description: 'Cigarettes and tobacco products', color: '#7bed9f' },
    { name: 'Household', description: 'Cleaning supplies, toiletries', color: '#5352ed' },
    { name: 'Food Items', description: 'Frozen food, sandwiches', color: '#ff6348' },
    { name: 'Automotive', description: 'Motor oil, windshield fluid', color: '#2f3542' }
  ] as Omit<Category, 'id' | 'createdAt'>[],
  
  products: [
    {
      name: 'Lay\'s Classic Chips',
      price: 2.49,
      category: 'Snacks',
      sku: 'LAYS-CLASSIC',
      stock: 48,
      description: 'Original flavor potato chips, 2.875oz bag',
      barcode: '028400056366'
    },
    {
      name: 'Coca-Cola 20oz',
      price: 2.19,
      category: 'Beverages',
      sku: 'COKE-20OZ',
      stock: 36,
      description: 'Coca-Cola classic, 20 fl oz bottle',
      barcode: '049000042566'
    },
    {
      name: 'Red Bull Energy',
      price: 3.99,
      category: 'Beverages',
      sku: 'REDBULL-8OZ',
      stock: 24,
      description: 'Red Bull energy drink, 8.4 fl oz can',
      barcode: '9002490100026'
    },
    {
      name: 'Marlboro Red',
      price: 8.50,
      category: 'Tobacco',
      sku: 'MARL-RED-PACK',
      stock: 200,
      description: 'Marlboro Red cigarettes, pack',
      barcode: '028200002129'
    },
    {
      name: 'Hot Pocket Ham & Cheese',
      price: 2.99,
      category: 'Food Items',
      sku: 'HOTPOCK-HAM',
      stock: 12,
      description: 'Frozen hot pocket, ham and cheese, 2-pack',
      barcode: '043695082024'
    }
  ] as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]
};

// Business template loader helper
export const loadBusinessTemplate = (businessType: 'carDealership' | 'coffeeShop' | 'restaurant' | 'convenienceStore') => {
  switch (businessType) {
    case 'carDealership':
      return carDealershipData;
    case 'coffeeShop':
      return coffeeShopData;
    case 'restaurant':
      return restaurantData;
    case 'convenienceStore':
      return convenienceStoreData;
    default:
      return convenienceStoreData;
  }
};
