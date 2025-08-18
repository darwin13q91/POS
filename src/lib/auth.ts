// Role-based access control system
export type UserRole = 'staff' | 'manager' | 'owner' | 'developer' | 'support';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  businessId: string;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface Permission {
  module: string;
  actions: string[];
}

export interface RoleConfig {
  role: UserRole;
  label: string;
  description: string;
  permissions: Permission[];
  accessLevel: number; // 1-5, higher = more access
}

// Default role configurations
export const roleConfigs: Record<UserRole, RoleConfig> = {
  staff: {
    role: 'staff',
    label: 'Staff',
    description: 'Basic POS operations and customer service',
    accessLevel: 1,
    permissions: [
      { module: 'pos', actions: ['view', 'process_sale', 'void_item'] },
      { module: 'customers', actions: ['view', 'create', 'edit'] },
      { module: 'inventory', actions: ['view'] },
      { module: 'reports', actions: ['view_basic'] }
    ]
  },
  manager: {
    role: 'manager',
    label: 'Manager',
    description: 'Store management and advanced operations',
    accessLevel: 2,
    permissions: [
      { module: 'pos', actions: ['view', 'process_sale', 'void_item', 'refund', 'discount'] },
      { module: 'customers', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'inventory', actions: ['view', 'edit', 'adjust_stock'] },
      { module: 'reports', actions: ['view_basic', 'view_detailed', 'export'] },
      { module: 'staff', actions: ['view', 'manage_shifts'] }
    ]
  },
  owner: {
    role: 'owner',
    label: 'Business Owner',
    description: 'Full business control and analytics',
    accessLevel: 3,
    permissions: [
      { module: 'pos', actions: ['*'] },
      { module: 'customers', actions: ['*'] },
      { module: 'inventory', actions: ['*'] },
      { module: 'reports', actions: ['*'] },
      { module: 'staff', actions: ['*'] },
      { module: 'settings', actions: ['*'] },
      { module: 'business', actions: ['*'] }
    ]
  },
  developer: {
    role: 'developer',
    label: 'Developer',
    description: 'System development and debugging',
    accessLevel: 4,
    permissions: [
      { module: 'pos', actions: ['*'] },
      { module: 'customers', actions: ['*'] },
      { module: 'inventory', actions: ['*'] },
      { module: 'reports', actions: ['*'] },
      { module: 'staff', actions: ['*'] },
      { module: 'settings', actions: ['*'] },
      { module: 'business', actions: ['*'] },
      { module: 'system', actions: ['*'] },
      { module: 'debug', actions: ['*'] },
      { module: 'maintenance', actions: ['*'] }
    ]
  },
  support: {
    role: 'support',
    label: 'Technical Support',
    description: 'Remote support and troubleshooting',
    accessLevel: 5,
    permissions: [
      { module: 'pos', actions: ['view'] },
      { module: 'customers', actions: ['view'] },
      { module: 'inventory', actions: ['view'] },
      { module: 'reports', actions: ['view_basic', 'view_detailed'] },
      { module: 'system', actions: ['*'] },
      { module: 'debug', actions: ['*'] },
      { module: 'maintenance', actions: ['*'] },
      { module: 'support', actions: ['*'] }
    ]
  }
};

export class AuthService {
  private currentUser: User | null = null;
  private users: User[] = [];

  constructor() {
    this.loadUsers();
    this.loadCurrentUser();
  }

  private loadUsers(): void {
    const storedUsers = localStorage.getItem('pos-users');
    if (storedUsers) {
      this.users = JSON.parse(storedUsers);
    } else {
      // Create default users
      this.createDefaultUsers();
    }
  }

  private createDefaultUsers(): void {
    const defaultUsers: User[] = [
      {
        id: 'staff-001',
        username: 'cashier1',
        email: 'cashier@business.com',
        role: 'staff',
        permissions: roleConfigs.staff.permissions,
        businessId: 'demo-business',
        createdAt: new Date(),
        isActive: true
      },
      {
        id: 'manager-001',
        username: 'manager1',
        email: 'manager@business.com',
        role: 'manager',
        permissions: roleConfigs.manager.permissions,
        businessId: 'demo-business',
        createdAt: new Date(),
        isActive: true
      },
      {
        id: 'owner-001',
        username: 'owner',
        email: 'owner@business.com',
        role: 'owner',
        permissions: roleConfigs.owner.permissions,
        businessId: 'demo-business',
        createdAt: new Date(),
        isActive: true
      },
      {
        id: 'dev-001',
        username: 'developer',
        email: 'dev@possystem.com',
        role: 'developer',
        permissions: roleConfigs.developer.permissions,
        businessId: 'pos-system-dev',
        createdAt: new Date(),
        isActive: true
      }
    ];

    this.users = defaultUsers;
    this.saveUsers();
  }

  private loadCurrentUser(): void {
    const storedUser = localStorage.getItem('pos-current-user');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
    }
  }

  private saveUsers(): void {
    localStorage.setItem('pos-users', JSON.stringify(this.users));
  }

  private saveCurrentUser(): void {
    if (this.currentUser) {
      localStorage.setItem('pos-current-user', JSON.stringify(this.currentUser));
    }
  }

  login(username: string): User | null {
    // Simple demo authentication - in production, use proper authentication with password
    const user = this.users.find(u => u.username === username && u.isActive);
    
    if (user) {
      user.lastLogin = new Date();
      this.currentUser = user;
      this.saveCurrentUser();
      this.saveUsers();
      return user;
    }
    
    return null;
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('pos-current-user');
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  hasPermission(module: string, action: string): boolean {
    if (!this.currentUser) return false;
    
    const permission = this.currentUser.permissions.find(p => p.module === module);
    if (!permission) return false;
    
    return permission.actions.includes('*') || permission.actions.includes(action);
  }

  canAccessModule(module: string): boolean {
    if (!this.currentUser) return false;
    
    return this.currentUser.permissions.some(p => p.module === module);
  }

  getAccessibleModules(): string[] {
    if (!this.currentUser) return [];
    
    return this.currentUser.permissions.map(p => p.module);
  }

  createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    this.users.push(newUser);
    this.saveUsers();
    return newUser;
  }

  updateUser(userId: string, updates: Partial<User>): boolean {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;

    this.users[userIndex] = { ...this.users[userIndex], ...updates };
    this.saveUsers();

    // Update current user if it's the same user
    if (this.currentUser?.id === userId) {
      this.currentUser = this.users[userIndex];
      this.saveCurrentUser();
    }

    return true;
  }

  deleteUser(userId: string): boolean {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;

    this.users[userIndex].isActive = false;
    this.saveUsers();
    return true;
  }

  getAllUsers(): User[] {
    return this.users.filter(u => u.isActive);
  }

  getUsersByRole(role: UserRole): User[] {
    return this.users.filter(u => u.role === role && u.isActive);
  }
}

// Export singleton instance
export const authService = new AuthService();
