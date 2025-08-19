import { db } from '../lib/database';
import type { Product, Category } from '../lib/database';

export interface StockAlert {
  id: number;
  productId: number;
  productName: string;
  currentStock: number;
  threshold: number;
  severity: 'low' | 'critical' | 'out-of-stock';
  createdAt: Date;
}

export interface ProductVariant {
  id?: number;
  productId: number;
  name: string; // e.g., "Size", "Color"
  value: string; // e.g., "Large", "Red"
  sku: string;
  price: number;
  stock: number;
  isDefault: boolean;
}

export interface Supplier {
  id?: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrder {
  id?: number;
  orderNumber: string;
  supplierId: number;
  supplierName: string;
  orderDate: Date;
  expectedDate?: Date;
  status: 'pending' | 'ordered' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface InventoryTransaction {
  id?: number;
  productId: number;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reference?: string; // PO number, sale number, etc.
  userId: string;
  createdAt: Date;
}

class AdvancedInventoryService {
  // Stock Management
  async getStockAlerts(): Promise<StockAlert[]> {
    try {
      const lowStockThreshold = parseInt(await db.getSystemConfig('low_stock_threshold') || '10');
      const products = await db.products.toArray();
      const alerts: StockAlert[] = [];

      for (const product of products) {
        if (product.stock <= 0) {
          alerts.push({
            id: product.id!,
            productId: product.id!,
            productName: product.name,
            currentStock: product.stock,
            threshold: lowStockThreshold,
            severity: 'out-of-stock',
            createdAt: new Date()
          });
        } else if (product.stock <= Math.floor(lowStockThreshold * 0.5)) {
          alerts.push({
            id: product.id!,
            productId: product.id!,
            productName: product.name,
            currentStock: product.stock,
            threshold: lowStockThreshold,
            severity: 'critical',
            createdAt: new Date()
          });
        } else if (product.stock <= lowStockThreshold) {
          alerts.push({
            id: product.id!,
            productId: product.id!,
            productName: product.name,
            currentStock: product.stock,
            threshold: lowStockThreshold,
            severity: 'low',
            createdAt: new Date()
          });
        }
      }

      return alerts.sort((a, b) => {
        const severityOrder = { 'out-of-stock': 3, 'critical': 2, 'low': 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
    } catch (error) {
      console.error('Error getting stock alerts:', error);
      return [];
    }
  }

  // Product Search and Filtering
  async searchProducts(term: string, categoryId?: number): Promise<Product[]> {
    try {
      let products = await db.products.toArray();

      if (categoryId) {
        const category = await db.categories.get(categoryId);
        if (category) {
          products = products.filter(p => p.category === category.name);
        }
      }

      if (term) {
        const searchTerm = term.toLowerCase();
        products = products.filter(product => 
          product.name.toLowerCase().includes(searchTerm) ||
          product.sku.toLowerCase().includes(searchTerm) ||
          product.description?.toLowerCase().includes(searchTerm) ||
          product.barcode?.includes(searchTerm)
        );
      }

      return products.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  // Bulk Operations
  async bulkUpdatePrices(updates: { id: number; price: number }[]): Promise<void> {
    try {
      await db.transaction('rw', db.products, async () => {
        for (const update of updates) {
          await db.products.update(update.id, { 
            price: update.price,
            updatedAt: new Date()
          });
        }
      });
    } catch (error) {
      console.error('Error bulk updating prices:', error);
      throw error;
    }
  }

  async bulkUpdateStock(updates: { id: number; stock: number; reason: string }[], userId: string): Promise<void> {
    try {
      await db.transaction('rw', db.products, async () => {
        for (const update of updates) {
          const product = await db.products.get(update.id);
          if (product) {
            const oldStock = product.stock;
            await db.products.update(update.id, { 
              stock: update.stock,
              updatedAt: new Date()
            });

            // Log inventory transaction
            await this.logInventoryTransaction({
              productId: update.id,
              type: 'adjustment',
              quantity: update.stock - oldStock,
              reason: update.reason,
              userId,
              createdAt: new Date()
            });
          }
        }
      });
    } catch (error) {
      console.error('Error bulk updating stock:', error);
      throw error;
    }
  }

  // Category Management
  async createCategory(category: Omit<Category, 'id' | 'createdAt'>): Promise<number> {
    try {
      return await db.categories.add({
        ...category,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async updateCategory(id: number, updates: Partial<Category>): Promise<void> {
    try {
      await db.categories.update(id, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async deleteCategory(id: number): Promise<void> {
    try {
      // Check if category is used by any products
      const productsInCategory = await db.products.where('category').equals(id.toString()).count();
      if (productsInCategory > 0) {
        throw new Error('Cannot delete category that contains products');
      }

      await db.categories.delete(id);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // Advanced Product Operations
  async duplicateProduct(productId: number): Promise<number> {
    try {
      const original = await db.products.get(productId);
      if (!original) {
        throw new Error('Product not found');
      }

      const duplicate = {
        ...original,
        name: `${original.name} (Copy)`,
        sku: `${original.sku}-COPY-${Date.now()}`,
        barcode: undefined, // Remove barcode to avoid duplicates
        stock: 0, // Start with zero stock
        createdAt: new Date(),
        updatedAt: new Date()
      };

      delete duplicate.id;
      return await db.products.add(duplicate);
    } catch (error) {
      console.error('Error duplicating product:', error);
      throw error;
    }
  }

  async getProductsByCategory(): Promise<{ [categoryName: string]: Product[] }> {
    try {
      const products = await db.products.toArray();
      const grouped: { [categoryName: string]: Product[] } = {};

      products.forEach(product => {
        if (!grouped[product.category]) {
          grouped[product.category] = [];
        }
        grouped[product.category].push(product);
      });

      return grouped;
    } catch (error) {
      console.error('Error grouping products by category:', error);
      return {};
    }
  }

  // Inventory Tracking
  async logInventoryTransaction(transaction: Omit<InventoryTransaction, 'id'>): Promise<void> {
    try {
      // This would be stored in a separate table in a real implementation
      console.log('Inventory Transaction:', transaction);
    } catch (error) {
      console.error('Error logging inventory transaction:', error);
    }
  }

  async adjustStock(productId: number, adjustment: number, reason: string, userId: string): Promise<void> {
    try {
      const product = await db.products.get(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const newStock = Math.max(0, product.stock + adjustment);
      await db.products.update(productId, { 
        stock: newStock,
        updatedAt: new Date()
      });

      await this.logInventoryTransaction({
        productId,
        type: adjustment > 0 ? 'in' : 'out',
        quantity: Math.abs(adjustment),
        reason,
        userId,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error adjusting stock:', error);
      throw error;
    }
  }

  // Import/Export
  async exportInventory(): Promise<string> {
    try {
      const products = await db.products.toArray();
      const categories = await db.categories.toArray();

      const exportData = {
        timestamp: new Date().toISOString(),
        products,
        categories
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting inventory:', error);
      throw error;
    }
  }

  async importInventory(jsonData: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.products || !Array.isArray(data.products)) {
        return { success: false, message: 'Invalid data format: products array required' };
      }

      let imported = 0;
      let skipped = 0;

      await db.transaction('rw', [db.products, db.categories], async () => {
        // Import categories if provided
        if (data.categories && Array.isArray(data.categories)) {
          for (const category of data.categories) {
            const existing = await db.categories.where('name').equals(category.name).first();
            if (!existing) {
              await db.categories.add({
                ...category,
                createdAt: new Date(),
                updatedAt: new Date()
              });
            }
          }
        }

        // Import products
        for (const product of data.products) {
          const existing = await db.products.where('sku').equals(product.sku).first();
          if (!existing) {
            await db.products.add({
              ...product,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            imported++;
          } else {
            skipped++;
          }
        }
      });

      return { 
        success: true, 
        message: `Import completed: ${imported} products imported, ${skipped} skipped (duplicates)` 
      };
    } catch (error) {
      console.error('Error importing inventory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: `Import failed: ${errorMessage}` };
    }
  }

  // Barcode Generation
  generateSKU(name: string, category: string): string {
    const nameCode = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const categoryCode = category.substring(0, 2).toUpperCase().replace(/[^A-Z]/g, 'X');
    const timestamp = Date.now().toString().slice(-6);
    return `${nameCode}${categoryCode}${timestamp}`;
  }

  generateBarcode(): string {
    // Generate a simple EAN-13 compatible barcode
    const countryCode = '123'; // Fake country code
    const manufacturerCode = '45678';
    const productCode = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const partial = countryCode + manufacturerCode + productCode;
    
    // Calculate check digit (simplified)
    const checkDigit = this.calculateEAN13CheckDigit(partial);
    return partial + checkDigit;
  }

  private calculateEAN13CheckDigit(code: string): string {
    let sum = 0;
    for (let i = 0; i < code.length; i++) {
      const digit = parseInt(code[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit.toString();
  }
}

export const inventoryService = new AdvancedInventoryService();
