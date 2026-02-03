import { Injectable } from '@angular/core';
import { AuthRoleService } from './auth-role.service';

/**
 * Service for managing granular permissions
 */
@Injectable({ providedIn: 'root' })
export class PermissionsService {
  constructor(private authRoleService: AuthRoleService) {}
  
  /**
   * Check if user can perform an action on a resource
   */
  can(action: string, resource: string): boolean {
    const permission = `${resource}:${action}`;
    return this.authRoleService.hasPermission(permission);
  }
  
  /**
   * Check if user can create a resource
   */
  canCreate(resource: string): boolean {
    return this.can('create', resource);
  }
  
  /**
   * Check if user can read/view a resource
   */
  canRead(resource: string): boolean {
    return this.can('read', resource);
  }
  
  /**
   * Check if user can update a resource
   */
  canUpdate(resource: string): boolean {
    return this.can('update', resource);
  }
  
  /**
   * Check if user can delete a resource
   */
  canDelete(resource: string): boolean {
    return this.can('delete', resource);
  }
  
  /**
   * Check if user can manage a resource (full CRUD)
   */
  canManage(resource: string): boolean {
    return this.can('manage', resource) || 
           (this.canCreate(resource) && 
            this.canRead(resource) && 
            this.canUpdate(resource) && 
            this.canDelete(resource));
  }
  
  /**
   * Get all permissions for a resource
   */
  getResourcePermissions(resource: string): {
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canManage: boolean;
  } {
    return {
      canCreate: this.canCreate(resource),
      canRead: this.canRead(resource),
      canUpdate: this.canUpdate(resource),
      canDelete: this.canDelete(resource),
      canManage: this.canManage(resource)
    };
  }
}
