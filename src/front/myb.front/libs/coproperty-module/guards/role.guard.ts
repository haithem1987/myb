import { Injectable, inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthRoleService } from '../services/auth-role.service';
import { CopropertyRole } from '../models/user-role.models';

/**
 * Guard to protect routes based on user roles
 */
@Injectable({ providedIn: 'root' })
export class RoleGuardService {
  constructor(
    private authRoleService: AuthRoleService,
    private router: Router
  ) {}
  
  canActivate(route: ActivatedRouteSnapshot): boolean {
    // Check if user is authenticated
    if (!this.authRoleService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }
    
    // Get required roles from route data
    const requiredRoles = route.data['roles'] as CopropertyRole[];
    
    // If no roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    
    // Check if user has any of the required roles
    const hasRole = this.authRoleService.hasAnyRole(requiredRoles);
    
    if (!hasRole) {
      console.warn('Access denied. User does not have required roles:', requiredRoles);
      // Redirect to user's default route
      this.authRoleService.navigateToDefaultRoute();
      return false;
    }
    
    return true;
  }
}

/**
 * Functional guard for role-based route protection
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const guardService = inject(RoleGuardService);
  return guardService.canActivate(route);
};
