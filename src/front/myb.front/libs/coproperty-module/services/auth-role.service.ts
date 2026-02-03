import { Injectable, signal, computed, inject } from '@angular/core';
import { CopropertyRole, UserWithRole, Permission } from '../models/user-role.models';
import { Router } from '@angular/router';

/**
 * Service for managing user roles and permissions in the coproperty module
 * Integrates with Keycloak authentication
 */
@Injectable({ providedIn: 'root' })
export class AuthRoleService {
  private currentUser = signal<UserWithRole | null>(null);
  private router = inject(Router);
  
  // Computed signals for convenient access
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly userRoles = computed(() => this.currentUser()?.roles ?? []);
  readonly userPermissions = computed(() => this.currentUser()?.permissions ?? []);
  
  constructor() {
    // Load user from storage on init
    this.loadUserFromStorage();
  }
  
  /**
   * Initialize user from Keycloak token
   * Maps Keycloak roles to coproperty roles
   */
  initializeFromKeycloak(keycloakToken: any): void {
    if (!keycloakToken) return;
    
    const roles = this.mapKeycloakRoles(keycloakToken.realm_access?.roles || []);
    const permissions = this.mapKeycloakPermissions(keycloakToken);
    
    const user: UserWithRole = {
      id: keycloakToken.sub,
      email: keycloakToken.email,
      firstName: keycloakToken.given_name || '',
      lastName: keycloakToken.family_name || '',
      roles,
      permissions,
      managedCoproperties: keycloakToken.managed_coproperties || [],
      ownedUnits: keycloakToken.owned_units || []
    };
    
    this.setUser(user);
  }
  
  /**
   * Map Keycloak roles to coproperty roles
   */
  private mapKeycloakRoles(keycloakRoles: string[]): CopropertyRole[] {
    const roleMap: { [key: string]: CopropertyRole } = {
      'coproperty-syndic': CopropertyRole.SYNDIC,
      'coproperty-admin': CopropertyRole.SYNDIC,
      'coproperty-owner': CopropertyRole.OWNER,
      'coproperty-council': CopropertyRole.COUNCIL,
      'coproperty-accountant': CopropertyRole.ACCOUNTANT,
      'system-admin': CopropertyRole.ADMIN
    };
    
    return keycloakRoles
      .map(role => roleMap[role])
      .filter(role => role !== undefined);
  }
  
  /**
   * Map Keycloak token to permissions
   */
  private mapKeycloakPermissions(token: any): string[] {
    const permissions: string[] = [];
    const roles = token.realm_access?.roles || [];
    
    // Map roles to permissions
    if (roles.includes('coproperty-syndic') || roles.includes('coproperty-admin')) {
      permissions.push(
        'coproperty:create', 'coproperty:read', 'coproperty:update', 'coproperty:delete',
        'charges:create', 'charges:read', 'charges:update', 'charges:delete', 'charges:manage',
        'invoices:create', 'invoices:read', 'invoices:update', 'invoices:delete', 'invoices:manage',
        'maintenance:create', 'maintenance:read', 'maintenance:update', 'maintenance:delete', 'maintenance:assign',
        'fundcalls:create', 'fundcalls:read', 'fundcalls:update', 'fundcalls:send',
        'reports:view', 'reports:export'
      );
    }
    
    if (roles.includes('coproperty-owner')) {
      permissions.push(
        'invoices:read',
        'maintenance:create', 'maintenance:read',
        'reports:view'
      );
    }
    
    if (roles.includes('coproperty-council')) {
      permissions.push(
        'coproperty:read',
        'charges:read',
        'invoices:read',
        'reports:view', 'reports:export'
      );
    }
    
    if (roles.includes('coproperty-accountant')) {
      permissions.push(
        'charges:read', 'charges:manage',
        'invoices:create', 'invoices:read', 'invoices:update', 'invoices:manage',
        'reports:view', 'reports:export'
      );
    }
    
    if (roles.includes('system-admin')) {
      permissions.push(
        'system:users', 'system:permissions', 'system:monitoring'
      );
    }
    
    return permissions;
  }
  
  /**
   * Set the current authenticated user
   */
  setUser(user: UserWithRole | null): void {
    this.currentUser.set(user);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }
  
  /**
   * Get the current user
   */
  getUser(): UserWithRole | null {
    return this.currentUser();
  }
  
  /**
   * Load user from local storage
   */
  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        const user = JSON.parse(userJson) as UserWithRole;
        this.currentUser.set(user);
      } catch (error) {
        console.error('Failed to parse user from storage', error);
        localStorage.removeItem('currentUser');
      }
    }
  }
  
  /**
   * Check if user has a specific role
   */
  hasRole(role: CopropertyRole): boolean {
    return this.currentUser()?.roles.includes(role) ?? false;
  }
  
  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: CopropertyRole[]): boolean {
    const userRoles = this.currentUser()?.roles ?? [];
    return roles.some(role => userRoles.includes(role));
  }
  
  /**
   * Check if user has all of the specified roles
   */
  hasAllRoles(roles: CopropertyRole[]): boolean {
    const userRoles = this.currentUser()?.roles ?? [];
    return roles.every(role => userRoles.includes(role));
  }
  
  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    return this.currentUser()?.permissions.includes(permission) ?? false;
  }
  
  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    const userPermissions = this.currentUser()?.permissions ?? [];
    return permissions.some(permission => userPermissions.includes(permission));
  }
  
  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    const userPermissions = this.currentUser()?.permissions ?? [];
    return permissions.every(permission => userPermissions.includes(permission));
  }
  
  /**
   * Get the primary role for routing purposes
   * Priority: ADMIN > SYNDIC > COUNCIL > ACCOUNTANT > OWNER
   */
  getPrimaryRole(): CopropertyRole | null {
    const roles = this.currentUser()?.roles ?? [];
    
    if (roles.includes(CopropertyRole.ADMIN)) return CopropertyRole.ADMIN;
    if (roles.includes(CopropertyRole.SYNDIC)) return CopropertyRole.SYNDIC;
    if (roles.includes(CopropertyRole.COUNCIL)) return CopropertyRole.COUNCIL;
    if (roles.includes(CopropertyRole.ACCOUNTANT)) return CopropertyRole.ACCOUNTANT;
    if (roles.includes(CopropertyRole.OWNER)) return CopropertyRole.OWNER;
    
    return null;
  }
  
  /**
   * Get default route based on user's primary role
   */
  getDefaultRoute(): string {
    const role = this.getPrimaryRole();
    
    switch (role) {
      case CopropertyRole.SYNDIC:
        return '/coproperty/syndic/dashboard';
      case CopropertyRole.OWNER:
        return '/coproperty/owner/dashboard';
      case CopropertyRole.COUNCIL:
        return '/coproperty/council/dashboard';
      case CopropertyRole.ACCOUNTANT:
        return '/coproperty/accountant/dashboard';
      case CopropertyRole.ADMIN:
        return '/admin/system';
      default:
        return '/';
    }
  }
  
  /**
   * Navigate to user's default route
   */
  navigateToDefaultRoute(): void {
    const route = this.getDefaultRoute();
    this.router.navigate([route]);
  }
  
  /**
   * Check if user can manage a specific coproperty
   */
  canManageCoproperty(copropertyId: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    
    // Admin can manage all
    if (user.roles.includes(CopropertyRole.ADMIN)) return true;
    
    // Syndic can manage assigned coproperties
    if (user.roles.includes(CopropertyRole.SYNDIC)) {
      return user.managedCoproperties?.includes(copropertyId) ?? false;
    }
    
    return false;
  }
  
  /**
   * Check if user owns a specific unit
   */
  ownsUnit(unitId: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    
    return user.ownedUnits?.includes(unitId) ?? false;
  }
  
  /**
   * Logout the current user
   */
  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }
}
