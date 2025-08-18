// Enhanced dynamic data management with real-time synchronization
import { db, type Product, type Sale, type Customer, type Category } from './database';

// Define union type for all database record types
type DatabaseRecord = Product | Sale | Customer | Category;

export interface DataSyncConfig {
  apiBaseUrl: string;
  businessId: string;
  userId: string;
  syncInterval: number;
  enableRealTime: boolean;
}

export interface SyncOperation {
  id: string;
  table: string;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: Date;
  synced: boolean;
  userId: string;
}

export interface DataEvent {
  type: 'data-change';
  table: string;
  operation: 'create' | 'update' | 'delete';
  record: Record<string, unknown>;
  timestamp: Date;
}

class DynamicDataManager {
  private config: DataSyncConfig;
  private syncQueue: SyncOperation[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncTimer: NodeJS.Timeout | null = null;
  private eventListeners: ((event: DataEvent) => void)[] = [];
  private websocket: WebSocket | null = null;

  // Helper function to convert objects to Record<string, unknown>
  private toRecord(obj: unknown): Record<string, unknown> {
    return obj as Record<string, unknown>;
  }

  constructor(config: DataSyncConfig) {
    this.config = config;
    this.initializeEventListeners();
    this.startAutoSync();
    
    if (config.enableRealTime) {
      this.initializeWebSocket();
    }
  }

  private initializeEventListeners() {
    // Monitor network status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Monitor database changes
    this.setupDatabaseHooks();
  }

  private setupDatabaseHooks() {
    // Hook into Dexie transactions to track changes
    db.products.hook('creating', (_primKey, obj) => {
      this.queueSyncOperation('products', 'create', this.toRecord(obj));
      this.notifyDataChange('products', 'create', this.toRecord(obj));
    });

    db.products.hook('updating', (modifications, primKey, obj) => {
      this.queueSyncOperation('products', 'update', this.toRecord({ id: primKey, ...modifications }));
      this.notifyDataChange('products', 'update', this.toRecord({ id: primKey, ...obj, ...modifications }));
    });

    db.products.hook('deleting', (_primKey, obj) => {
      this.queueSyncOperation('products', 'delete', this.toRecord({ id: obj.id }));
      this.notifyDataChange('products', 'delete', this.toRecord(obj));
    });

    // Similar hooks for other tables
    const tableNames = ['sales', 'customers', 'categories'] as const;
    tableNames.forEach(tableName => {
      const table = db[tableName];
      
      table.hook('creating', (_primKey: number, obj: DatabaseRecord) => {
        this.queueSyncOperation(tableName, 'create', this.toRecord(obj));
        this.notifyDataChange(tableName, 'create', this.toRecord(obj));
      });

      table.hook('updating', (modifications: Partial<DatabaseRecord>, primKey: number, obj: DatabaseRecord) => {
        this.queueSyncOperation(tableName, 'update', this.toRecord({ id: primKey, ...modifications }));
        this.notifyDataChange(tableName, 'update', this.toRecord({ id: primKey, ...obj, ...modifications }));
      });

      table.hook('deleting', (_primKey: number, obj: DatabaseRecord) => {
        this.queueSyncOperation(tableName, 'delete', this.toRecord({ id: (obj as { id: number }).id }));
        this.notifyDataChange(tableName, 'delete', this.toRecord(obj));
      });
    });
  }

  private queueSyncOperation(table: string, operation: 'create' | 'update' | 'delete', data: Record<string, unknown>) {
    const syncOp: SyncOperation = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      table,
      operation,
      data: {
        ...data,
        businessId: this.config.businessId,
        userId: this.config.userId,
        timestamp: new Date()
      },
      timestamp: new Date(),
      synced: false,
      userId: this.config.userId
    };

    this.syncQueue.push(syncOp);
    this.saveSyncQueue();

    // Try immediate sync if online
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  private notifyDataChange(table: string, operation: 'create' | 'update' | 'delete', record: Record<string, unknown>) {
    const event: DataEvent = {
      type: 'data-change',
      table,
      operation,
      record,
      timestamp: new Date()
    };

    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in data change listener:', error);
      }
    });
  }

  private async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const pendingOps = this.syncQueue.filter(op => !op.synced);
    
    for (const operation of pendingOps) {
      try {
        await this.syncOperation(operation);
        operation.synced = true;
      } catch (error) {
        console.error('Sync operation failed:', error);
        // Keep in queue for retry
      }
    }

    // Clean up synced operations
    this.syncQueue = this.syncQueue.filter(op => !op.synced);
    this.saveSyncQueue();
  }

  private async syncOperation(operation: SyncOperation): Promise<void> {
    const endpoint = `${this.config.apiBaseUrl}/api/sync/${operation.table}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.businessId}`,
        'X-User-ID': this.config.userId
      },
      body: JSON.stringify({
        operation: operation.operation,
        data: operation.data,
        timestamp: operation.timestamp,
        syncId: operation.id
      })
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Sync operation completed:', result);
  }

  private saveSyncQueue() {
    try {
      localStorage.setItem('pos-sync-queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  private startAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.processSyncQueue();
      this.pullUpdatesFromServer();
    }, this.config.syncInterval);
  }

  private async pullUpdatesFromServer() {
    if (!this.isOnline) return;

    try {
      const lastSync = localStorage.getItem('pos-last-sync') || '1970-01-01T00:00:00.000Z';
      
      const response = await fetch(`${this.config.apiBaseUrl}/api/sync/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.businessId}`,
          'X-User-ID': this.config.userId
        },
        body: JSON.stringify({
          lastSync,
          businessId: this.config.businessId
        })
      });

      if (response.ok) {
        const updates = await response.json();
        await this.applyServerUpdates(updates);
        localStorage.setItem('pos-last-sync', new Date().toISOString());
      }
    } catch (error) {
      console.error('Failed to pull updates from server:', error);
    }
  }

  private async applyServerUpdates(updates: { data?: Record<string, unknown>[] }) {
    for (const update of updates.data || []) {
      try {
        // Skip if this update originated from this client
        if ((update as { userId?: string }).userId === this.config.userId) continue;

        const tableName = (update as { table?: string }).table;
        if (!tableName || !['products', 'sales', 'customers', 'categories'].includes(tableName)) continue;
        
        const operation = (update as { operation?: string }).operation;
        const updateData = (update as { data?: Record<string, unknown> }).data;
        
        // Type-safe table access with type assertions
        switch (tableName) {
          case 'products':
            switch (operation) {
              case 'create':
                if (updateData) await db.products.add(updateData as unknown as Product);
                break;
              case 'update':
                if (updateData && 'id' in updateData) await db.products.update(updateData.id as number, updateData as unknown as Partial<Product>);
                break;
              case 'delete':
                if (updateData && 'id' in updateData) await db.products.delete(updateData.id as number);
                break;
            }
            break;
          case 'sales':
            switch (operation) {
              case 'create':
                if (updateData) await db.sales.add(updateData as unknown as Sale);
                break;
              case 'update':
                if (updateData && 'id' in updateData) await db.sales.update(updateData.id as number, updateData as unknown as Partial<Sale>);
                break;
              case 'delete':
                if (updateData && 'id' in updateData) await db.sales.delete(updateData.id as number);
                break;
            }
            break;
          case 'customers':
            switch (operation) {
              case 'create':
                if (updateData) await db.customers.add(updateData as unknown as Customer);
                break;
              case 'update':
                if (updateData && 'id' in updateData) await db.customers.update(updateData.id as number, updateData as unknown as Partial<Customer>);
                break;
              case 'delete':
                if (updateData && 'id' in updateData) await db.customers.delete(updateData.id as number);
                break;
            }
            break;
          case 'categories':
            switch (operation) {
              case 'create':
                if (updateData) await db.categories.add(updateData as unknown as Category);
                break;
              case 'update':
                if (updateData && 'id' in updateData) await db.categories.update(updateData.id as number, updateData as unknown as Partial<Category>);
                break;
              case 'delete':
                if (updateData && 'id' in updateData) await db.categories.delete(updateData.id as number);
                break;
            }
            break;
        }

        if (tableName && operation && updateData && ['create', 'update', 'delete'].includes(operation)) {
          this.notifyDataChange(tableName, operation as 'create' | 'update' | 'delete', updateData);
        }
      } catch (error) {
        console.error('Failed to apply server update:', error);
      }
    }
  }

  private initializeWebSocket() {
    const wsUrl = this.config.apiBaseUrl.replace('http', 'ws') + '/ws/sync';
    
    try {
      this.websocket = new WebSocket(`${wsUrl}?businessId=${this.config.businessId}&userId=${this.config.userId}`);
      
      this.websocket.onopen = () => {
        console.log('Real-time sync connected');
      };

      this.websocket.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          this.handleRealTimeUpdate(update);
        } catch (error) {
          console.error('Failed to process real-time update:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('Real-time sync disconnected');
        // Reconnect after delay
        setTimeout(() => this.initializeWebSocket(), 5000);
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  private async handleRealTimeUpdate(update: Record<string, unknown>) {
    // Skip if this update originated from this client
    if (update.userId === this.config.userId) return;

    try {
      const tableName = update.table as string;
      const operation = update.operation as string;
      const updateData = update.data as Record<string, unknown>;
      
      // Handle different table types
      switch (tableName) {
        case 'products':
          switch (operation) {
            case 'create':
              await db.products.add(updateData as unknown as Product);
              break;
            case 'update':
              if (updateData && 'id' in updateData) {
                await db.products.update(updateData.id as number, updateData as unknown as Partial<Product>);
              }
              break;
            case 'delete':
              if (updateData && 'id' in updateData) {
                await db.products.delete(updateData.id as number);
              }
              break;
          }
          break;
        case 'sales':
          switch (operation) {
            case 'create':
              await db.sales.add(updateData as unknown as Sale);
              break;
            case 'update':
              if (updateData && 'id' in updateData) {
                await db.sales.update(updateData.id as number, updateData as unknown as Partial<Sale>);
              }
              break;
            case 'delete':
              if (updateData && 'id' in updateData) {
                await db.sales.delete(updateData.id as number);
              }
              break;
          }
          break;
        case 'customers':
          switch (operation) {
            case 'create':
              await db.customers.add(updateData as unknown as Customer);
              break;
            case 'update':
              if (updateData && 'id' in updateData) {
                await db.customers.update(updateData.id as number, updateData as unknown as Partial<Customer>);
              }
              break;
            case 'delete':
              if (updateData && 'id' in updateData) {
                await db.customers.delete(updateData.id as number);
              }
              break;
          }
          break;
        case 'categories':
          switch (operation) {
            case 'create':
              await db.categories.add(updateData as unknown as Category);
              break;
            case 'update':
              if (updateData && 'id' in updateData) {
                await db.categories.update(updateData.id as number, updateData as unknown as Partial<Category>);
              }
              break;
            case 'delete':
              if (updateData && 'id' in updateData) {
                await db.categories.delete(updateData.id as number);
              }
              break;
          }
          break;
      }

      this.notifyDataChange(tableName, operation as 'create' | 'update' | 'delete', updateData);
    } catch (error) {
      console.error('Failed to apply real-time update:', error);
    }
  }

  // Public API methods
  
  public addEventListener(listener: (event: DataEvent) => void) {
    this.eventListeners.push(listener);
  }

  public removeEventListener(listener: (event: DataEvent) => void) {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  public async forceSync(): Promise<void> {
    await this.processSyncQueue();
    await this.pullUpdatesFromServer();
  }

  public getSyncStatus() {
    return {
      isOnline: this.isOnline,
      pendingOperations: this.syncQueue.filter(op => !op.synced).length,
      lastSync: localStorage.getItem('pos-last-sync'),
      realTimeEnabled: this.config.enableRealTime,
      websocketConnected: this.websocket?.readyState === WebSocket.OPEN
    };
  }

  public async exportData(): Promise<Record<string, unknown>> {
    return {
      products: await db.products.toArray(),
      sales: await db.sales.toArray(),
      customers: await db.customers.toArray(),
      categories: await db.categories.toArray(),
      timestamp: new Date().toISOString()
    };
  }

  public async importData(data: Record<string, unknown>): Promise<void> {
    await db.transaction('rw', [db.products, db.sales, db.customers, db.categories], async () => {
      if (data.products && Array.isArray(data.products)) {
        await db.products.clear();
        await db.products.bulkAdd(data.products as Product[]);
      }
      if (data.sales && Array.isArray(data.sales)) {
        await db.sales.clear();
        await db.sales.bulkAdd(data.sales as Sale[]);
      }
      if (data.customers && Array.isArray(data.customers)) {
        await db.customers.clear();
        await db.customers.bulkAdd(data.customers as Customer[]);
      }
      if (data.categories && Array.isArray(data.categories)) {
        await db.categories.clear();
        await db.categories.bulkAdd(data.categories as Category[]);
      }
    });
  }

  public destroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    if (this.websocket) {
      this.websocket.close();
    }
    
    this.eventListeners = [];
  }
}

// Export singleton instance
let dataManager: DynamicDataManager | null = null;

export const initializeDataManager = (config: DataSyncConfig): DynamicDataManager => {
  if (dataManager) {
    dataManager.destroy();
  }
  
  dataManager = new DynamicDataManager(config);
  return dataManager;
};

export const getDataManager = (): DynamicDataManager | null => {
  return dataManager;
};
