import { db } from './database';
import type { AppUser } from './database';

// Role-based access control system
export type UserRole = 'staff' | 'manager' | 'owner' | 'developer' | 'support' | 'superadmin';

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
  passwordHash?: string;
  lastPasswordChange?: Date;
  loginAttempts?: number;
  lockedUntil?: Date;
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
  accessLevel: number;
}

// Dynamic role configurations loaded from database
export const getRoleConfigs = async (): Promise<Record<UserRole, RoleConfig>> => {
  const roles: UserRole[] = ['staff', 'manager', 'owner', 'developer', 'support', 'superadmin'];
  const configs: Record<string, RoleConfig> = {};
  
  for (const role of roles) {
    const rolePermissions = await db.getRolePermissions(role);
    
    const permissions: Permission[] = [];
    const permissionMap: Record<string, string[]> = {};
    
    rolePermissions.forEach(rp => {
      if (!permissionMap[rp.module]) {
        permissionMap[rp.module] = [];
      }
      permissionMap[rp.module] = rp.actions.split(',');
    });
    
    Object.entries(permissionMap).forEach(([module, actions]) => {
      permissions.push({ module, actions });
    });
    
    configs[role] = {
      role,
      label: role.charAt(0).toUpperCase() + role.slice(1),
      description: `${role} level access`,
      permissions,
      accessLevel: getAccessLevel(role)
    };
  }
  
  return configs as Record<UserRole, RoleConfig>;
};

function getAccessLevel(role: UserRole): number {
  switch (role) {
    case 'staff': return 1;
    case 'manager': return 2;
    case 'owner': return 3;
    case 'developer': return 4;
    case 'support': return 5;
    default: return 1;
  }
}

export class AuthService {
  private currentUser: User | null = null;

  constructor() {
    this.loadCurrentUser();
  }

  // Password hashing (in production, use proper bcrypt)
  private hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  private async getUserPermissions(role: UserRole): Promise<Permission[]> {
    const rolePermissions = await db.getRolePermissions(role);
    
    // Group permissions by module
    const permissionMap: Record<string, string[]> = {};
    
    rolePermissions.forEach(rp => {
      if (!permissionMap[rp.module]) {
        permissionMap[rp.module] = [];
      }
      permissionMap[rp.module] = rp.actions.split(',');
    });
    
    return Object.entries(permissionMap).map(([module, actions]) => ({
      module,
      actions
    }));
  }

  private async convertDbUserToUser(dbUser: AppUser): Promise<User> {
    const permissions = await this.getUserPermissions(dbUser.role);
    return {
      id: dbUser.userId,
      username: dbUser.username,
      email: dbUser.email,
      role: dbUser.role,
      permissions,
      businessId: dbUser.businessId,
      createdAt: dbUser.createdAt,
      lastLogin: dbUser.lastLogin,
      isActive: dbUser.isActive,
      passwordHash: dbUser.passwordHash,
      lastPasswordChange: dbUser.lastPasswordChange,
      loginAttempts: dbUser.loginAttempts,
      lockedUntil: dbUser.lockedUntil
    };
  }

  private loadCurrentUser(): void {
    const storedUser = localStorage.getItem('pos-current-user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      
      // Convert string dates back to Date objects
      if (parsedUser.createdAt) {
        parsedUser.createdAt = new Date(parsedUser.createdAt);
      }
      if (parsedUser.lastLogin) {
        parsedUser.lastLogin = new Date(parsedUser.lastLogin);
      }
      if (parsedUser.lastPasswordChange) {
        parsedUser.lastPasswordChange = new Date(parsedUser.lastPasswordChange);
      }
      if (parsedUser.lockedUntil) {
        parsedUser.lockedUntil = new Date(parsedUser.lockedUntil);
      }
      
      this.currentUser = parsedUser;
    }
  }

  private saveCurrentUser(): void {
    if (this.currentUser) {
      localStorage.setItem('pos-current-user', JSON.stringify(this.currentUser));
    }
  }

  // Simple demo authentication - works with username only
  async login(username: string): Promise<User | null> {
    try {
      const dbUser = await db.getUserByUsername(username);
      
      if (!dbUser || !dbUser.isActive) {
        return null;
      }
      
      // Convert to User format and update login time
      const user = await this.convertDbUserToUser(dbUser);
      await db.updateUserLastLogin(dbUser.userId);
      
      user.lastLogin = new Date();
      this.currentUser = user;
      this.saveCurrentUser();
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  // Production authentication with password
  async authenticateUser(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const dbUser = await db.getUserByUsername(username);
      
      if (!dbUser || !dbUser.isActive) {
        return { success: false, error: 'Invalid username or password' };
      }

      // Check if account is locked
      if (dbUser.lockedUntil && dbUser.lockedUntil > new Date()) {
        const lockTime = Math.ceil((dbUser.lockedUntil.getTime() - Date.now()) / 1000 / 60);
        return { success: false, error: `Account locked for ${lockTime} minutes` };
      }

      // Verify password
      if (!dbUser.passwordHash || !this.verifyPassword(password, dbUser.passwordHash)) {
        await db.incrementLoginAttempts(dbUser.userId);
        return { success: false, error: 'Invalid username or password' };
      }

      // Convert to User format
      const user = await this.convertDbUserToUser(dbUser);
      
      // Update last login
      await db.updateUserLastLogin(dbUser.userId);
      
      // Set current user
      this.currentUser = user;
      this.saveCurrentUser();
      
      return { success: true, user };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('pos-current-user');
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async hasPermission(module: string, action: string): Promise<boolean> {
    if (!this.currentUser) return false;
    
    return db.hasPermission(this.currentUser.role, module, action);
  }

  async canAccess(module: string, action: string): Promise<boolean> {
    return this.hasPermission(module, action);
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  // User management methods (for admin/owner roles)
  async createUser(userData: {
    username: string;
    email: string;
    role: UserRole;
    password: string;
    businessId?: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Check if current user has permission
      if (!await this.hasPermission('users', 'create')) {
        return { success: false, error: 'Permission denied' };
      }

      // Check if username already exists
      const existingUser = await db.getUserByUsername(userData.username);
      if (existingUser) {
        return { success: false, error: 'Username already exists' };
      }

      // Create new user
      const newDbUser: Omit<AppUser, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: 'user-' + Date.now(),
        username: userData.username,
        email: userData.email,
        role: userData.role,
        businessId: userData.businessId || 'pos-default-001',
        passwordHash: this.hashPassword(userData.password),
        isActive: true,
        loginAttempts: 0
      };

      // Add to database (hooks will add timestamps)
      await db.appUsers.add(newDbUser as AppUser);

      // Convert to User format
      const user = await this.convertDbUserToUser(newDbUser as AppUser);
      
      return { success: true, user };
    } catch (error) {
      console.error('Create user error:', error);
      return { success: false, error: 'Failed to create user' };
    }
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!await this.hasPermission('users', 'update')) {
        return { success: false, error: 'Permission denied' };
      }

      const dbUser = await db.appUsers.where('userId').equals(userId).first();
      if (!dbUser?.id) {
        return { success: false, error: 'User not found' };
      }

      await db.appUsers.update(dbUser.id, {
        passwordHash: this.hashPassword(newPassword),
        lastPasswordChange: new Date(),
        loginAttempts: 0,
        lockedUntil: undefined,
        updatedAt: new Date()
      });

      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, error: 'Failed to update password' };
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      if (!await this.hasPermission('users', 'read')) {
        return [];
      }

      const dbUsers = await db.appUsers.toArray();
      const users: User[] = [];

      for (const dbUser of dbUsers) {
        const user = await this.convertDbUserToUser(dbUser);
        users.push(user);
      }

      return users;
    } catch (error) {
      console.error('Get all users error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
