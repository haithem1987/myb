import { Injectable, inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthRoleService } from '../services/auth-role.service';
import { PermissionsService } from '../services/permissions.service';

/**
 * Guard to protect routes based on user permissions
 */
@Injectable({ providedIn: 'root' })
export class PermissionsGuardService {
  constructor(
    private authRoleService: AuthRoleService,
    private permissionsService: PermissionsService,
    private router: Router
  ) {}
  
  canActivate(route: ActivatedRouteSnapshot): boolean {
    // Check if user is authenticated
    if (!this.authRoleService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }
    
    // Get required permission from route data
    const requiredPermission = route.data['permission'] as string;
    
    // If no permission required, allow access
    if (!requiredPermission) {
      return true;
    }
    
    // Check if user has the required permission
    const hasPermission = this.authRoleService.hasPermission(requiredPermission);
    
    if (!hasPermission) {
      console.warn('Access denied. User does not have required permission:', requiredPermission);
      this.router.navigate(['/unauthorized']);
      return false;
    }
    
    return true;
  }
}

/**
 * Functional guard for permission-based route protection
 */
export const permissionsGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const guardService = inject(PermissionsGuardService);
  return guardService.canActivate(route);
};
