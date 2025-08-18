// Remote maintenance and support system
export interface MaintenanceConfig {
  supportUrl: string;
  licenseKey: string;
  businessId: string;
  lastUpdateCheck: Date;
  maintenanceMode: boolean;
  supportLevel: 'basic' | 'premium' | 'enterprise';
}

export interface SystemInfo {
  version: string;
  platform: string;
  browser: string;
  lastSync: Date;
  dbSize: number;
  errorLogs: ErrorLog[];
  performanceMetrics: PerformanceMetric[];
}

export interface ErrorLog {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context: Record<string, unknown>;
}

export interface PerformanceMetric {
  timestamp: Date;
  metric: string;
  value: number;
  unit: string;
}

export interface RemoteCommand {
  id: string;
  type: 'update' | 'backup' | 'reset' | 'config' | 'diagnostic';
  payload: UpdatePayload | ResetPayload | ConfigPayload | null;
  timestamp: Date;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

export interface UpdatePayload {
  version: string;
  critical: boolean;
  changelog: string;
  downloadUrl?: string;
}

export interface ResetPayload {
  confirmed: boolean;
  preserveData?: boolean;
}

export interface ConfigPayload {
  businessInfo?: Record<string, unknown>;
  systemSettings?: Record<string, unknown>;
  maintenanceConfig?: Partial<MaintenanceConfig>;
}

export interface BackupData {
  timestamp: string;
  data: {
    products: unknown[];
    sales: unknown[];
    customers: unknown[];
    categories: unknown[];
  };
  systemInfo: SystemInfo;
}

export interface DatabaseHealth {
  status: 'healthy' | 'error';
  tables: {
    products: number;
    sales: number;
    customers: number;
  };
  lastBackup: string;
  size: number;
  error?: string;
}

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface SupportTicket {
  id: string;
  businessId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'feature-request' | 'training';
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  resolution?: string;
}

class RemoteMaintenanceService {
  private config: MaintenanceConfig;
  private systemInfo: SystemInfo;
  private isOnline: boolean = navigator.onLine;

  constructor(config: MaintenanceConfig) {
    this.config = config;
    this.systemInfo = this.collectSystemInfo();
    this.initializeService();
  }

  private initializeService() {
    // Monitor network status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncWithServer();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Periodic health checks
    setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000); // Every 5 minutes

    // Daily sync attempt
    setInterval(() => {
      if (this.isOnline) {
        this.syncWithServer();
      }
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }

  private collectSystemInfo(): SystemInfo {
    return {
      version: '1.0.0',
      platform: navigator.platform,
      browser: navigator.userAgent,
      lastSync: new Date(),
      dbSize: 0, // Will be calculated from IndexedDB
      errorLogs: this.getRecentErrorLogs(),
      performanceMetrics: this.getPerformanceMetrics()
    };
  }

  private getRecentErrorLogs(): ErrorLog[] {
    const logs = localStorage.getItem('pos-error-logs');
    return logs ? JSON.parse(logs) : [];
  }

  private getPerformanceMetrics(): PerformanceMetric[] {
    const metrics = localStorage.getItem('pos-performance-metrics');
    return metrics ? JSON.parse(metrics) : [];
  }

  async syncWithServer(): Promise<void> {
    if (!this.isOnline || this.config.maintenanceMode) {
      return;
    }

    try {
      const response = await fetch(`${this.config.supportUrl}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.licenseKey}`,
          'X-Business-ID': this.config.businessId
        },
        body: JSON.stringify({
          systemInfo: this.systemInfo,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        await this.processRemoteCommands(data.commands || []);
        this.config.lastUpdateCheck = new Date();
        this.saveConfig();
      }
    } catch (error) {
      this.logError('Failed to sync with support server', error);
    }
  }

  private async processRemoteCommands(commands: RemoteCommand[]): Promise<void> {
    for (const command of commands) {
      try {
        await this.executeCommand(command);
      } catch (error) {
        this.logError(`Failed to execute command ${command.id}`, error);
      }
    }
  }

  private async executeCommand(command: RemoteCommand): Promise<void> {
    switch (command.type) {
      case 'update':
        if (command.payload && 'version' in command.payload) {
          await this.performUpdate(command.payload as UpdatePayload);
        }
        break;
      case 'backup':
        await this.createBackup();
        break;
      case 'reset':
        if (command.payload && 'confirmed' in command.payload) {
          await this.resetSystem(command.payload as ResetPayload);
        }
        break;
      case 'config':
        if (command.payload) {
          await this.updateConfiguration(command.payload as ConfigPayload);
        }
        break;
      case 'diagnostic':
        await this.runDiagnostic();
        break;
    }
  }

  private async performUpdate(updateData: UpdatePayload): Promise<void> {
    console.log('Performing system update...', updateData);
    // Implementation for system updates
    
    // Show update notification to user
    this.showUpdateNotification();
    
    // Apply update when user confirms or automatically if critical
    if (updateData.critical || await this.getUserUpdateConsent()) {
      // Apply update logic here
      window.location.reload(); // Simple reload for now
    }
  }

  private async createBackup(): Promise<void> {
    console.log('Creating system backup...');
    // Export data as implemented in SettingsView
    const { db } = await import('../lib/database');
    
    const products = await db.products.toArray();
    const sales = await db.sales.toArray();
    const customers = await db.customers.toArray();
    const categories = await db.categories.toArray();

    const backupData: BackupData = {
      timestamp: new Date().toISOString(),
      data: { products, sales, customers, categories },
      systemInfo: this.systemInfo
    };

    // Send backup to server or save locally
    await this.sendBackupToServer(backupData);
  }

  private async sendBackupToServer(backupData: BackupData): Promise<void> {
    try {
      await fetch(`${this.config.supportUrl}/api/backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.licenseKey}`,
          'X-Business-ID': this.config.businessId
        },
        body: JSON.stringify(backupData)
      });
    } catch {
      // Save locally if server unavailable
      localStorage.setItem('pos-backup-pending', JSON.stringify(backupData));
    }
  }

  private async resetSystem(resetData: ResetPayload): Promise<void> {
    if (resetData.confirmed) {
      console.log('Performing system reset...');
      // Clear data and reset to defaults
      const { db } = await import('../lib/database');
      await db.clearAllData();
      await db.addSampleData();
      
      // Clear local storage
      localStorage.clear();
      
      // Reload application
      window.location.reload();
    }
  }

  private async updateConfiguration(configData: ConfigPayload): Promise<void> {
    console.log('Updating system configuration...', configData);
    
    // Update business settings
    if (configData.businessInfo) {
      localStorage.setItem('pos-business-info', JSON.stringify(configData.businessInfo));
    }
    
    // Update system settings
    if (configData.systemSettings) {
      localStorage.setItem('pos-system-settings', JSON.stringify(configData.systemSettings));
    }
    
    // Update maintenance config
    Object.assign(this.config, configData.maintenanceConfig || {});
    this.saveConfig();
  }

  private async runDiagnostic(): Promise<void> {
    console.log('Running system diagnostic...');
    
    const diagnostic = {
      timestamp: new Date().toISOString(),
      systemInfo: this.collectSystemInfo(),
      dbHealth: await this.checkDatabaseHealth(),
      performance: await this.measurePerformance(),
      connectivity: this.isOnline,
      errors: this.getRecentErrorLogs()
    };

    // Send diagnostic data to server
    await fetch(`${this.config.supportUrl}/api/diagnostic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.licenseKey}`,
        'X-Business-ID': this.config.businessId
      },
      body: JSON.stringify(diagnostic)
    });
  }

  private async checkDatabaseHealth(): Promise<DatabaseHealth> {
    try {
      const { db } = await import('../lib/database');
      
      const productCount = await db.products.count();
      const salesCount = await db.sales.count();
      const customerCount = await db.customers.count();
      
      return {
        status: 'healthy',
        tables: {
          products: productCount,
          sales: salesCount,
          customers: customerCount
        },
        lastBackup: localStorage.getItem('lastBackupTime') || 'never',
        size: 0
      };
    } catch (error) {
      return {
        status: 'error',
        tables: {
          products: 0,
          sales: 0,
          customers: 0
        },
        lastBackup: 'never',
        size: 0,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }

  private async measurePerformance(): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = [];
    
    // Database query performance
    const start = performance.now();
    try {
      const { db } = await import('../lib/database');
      await db.products.limit(100).toArray();
      const dbTime = performance.now() - start;
      
      metrics.push({
        timestamp: new Date(),
        metric: 'database_query_time',
        value: dbTime,
        unit: 'ms'
      });
    } catch {
      // Handle error silently
    }
    
    // Memory usage (approximate)
    if ('memory' in performance) {
      const memInfo: MemoryInfo = {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0
      };
      
      if ('memory' in performance) {
        const perfMemory = (performance as { memory?: MemoryInfo }).memory;
        if (perfMemory) {
          memInfo.usedJSHeapSize = perfMemory.usedJSHeapSize || 0;
          memInfo.totalJSHeapSize = perfMemory.totalJSHeapSize || 0;
          memInfo.jsHeapSizeLimit = perfMemory.jsHeapSizeLimit || 0;
        }
      }
      metrics.push({
        timestamp: new Date(),
        metric: 'memory_usage',
        value: memInfo.usedJSHeapSize / 1024 / 1024,
        unit: 'MB'
      });
    }
    
    return metrics;
  }

  private performHealthCheck(): void {
    // Check database connectivity
    this.checkDatabaseHealth().then(health => {
      if (health.status === 'error') {
        this.logError('Database health check failed', health.error || 'Unknown error');
      }
    });

    // Update system info
    this.systemInfo = this.collectSystemInfo();
  }

  private showUpdateNotification(): void {
    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('POS System Update Available', {
        body: 'A system update is ready to install.',
        icon: '/icon-192x192.png'
      });
    } else {
      // Fallback to in-app notification
      console.log('Update notification: System update available');
    }
  }

  private async getUserUpdateConsent(): Promise<boolean> {
    return confirm('A system update is available. Install now?');
  }

  private logError(message: string, error: Error | unknown): void {
    const errorLog: ErrorLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      level: 'error',
      message,
      stack: error instanceof Error ? error.stack : undefined,
      context: { error: error instanceof Error ? error.message : 'Unknown error' }
    };

    const logs = this.getRecentErrorLogs();
    logs.push(errorLog);
    
    // Keep only last 100 error logs
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    
    localStorage.setItem('pos-error-logs', JSON.stringify(logs));
    
    // Also log to console
    console.error(message, error);
  }

  private saveConfig(): void {
    localStorage.setItem('pos-maintenance-config', JSON.stringify(this.config));
  }

  // Public methods for support ticket creation
  async createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'businessId' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
    const supportTicket: SupportTicket = {
      ...ticket,
      id: Date.now().toString(),
      businessId: this.config.businessId,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const response = await fetch(`${this.config.supportUrl}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.licenseKey}`,
          'X-Business-ID': this.config.businessId
        },
        body: JSON.stringify(supportTicket)
      });

      if (response.ok) {
        const result = await response.json();
        return result.ticketId;
      } else {
        throw new Error('Failed to create support ticket');
      }
    } catch {
      // Store ticket locally if offline
      const pendingTickets = localStorage.getItem('pos-pending-tickets');
      const tickets = pendingTickets ? JSON.parse(pendingTickets) : [];
      tickets.push(supportTicket);
      localStorage.setItem('pos-pending-tickets', JSON.stringify(tickets));
      
      return supportTicket.id;
    }
  }

  async enableMaintenanceMode(): Promise<void> {
    this.config.maintenanceMode = true;
    this.saveConfig();
    
    // Show maintenance notification
    alert('System is now in maintenance mode. Some features may be unavailable.');
  }

  async disableMaintenanceMode(): Promise<void> {
    this.config.maintenanceMode = false;
    this.saveConfig();
  }

  getSystemStatus(): { online: boolean; maintenanceMode: boolean; lastSync: Date } {
    return {
      online: this.isOnline,
      maintenanceMode: this.config.maintenanceMode,
      lastSync: this.config.lastUpdateCheck
    };
  }
}

// Export singleton instance
export let maintenanceService: RemoteMaintenanceService | null = null;

export const initializeRemoteMaintenance = (config: MaintenanceConfig): RemoteMaintenanceService => {
  maintenanceService = new RemoteMaintenanceService(config);
  return maintenanceService;
};

export const getMaintenanceService = (): RemoteMaintenanceService | null => {
  return maintenanceService;
};
