import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthRoleService } from '../services/auth-role.service';

/**
 * Guard to ensure user is authenticated
 */
@Injectable({ providedIn: 'root' })
export class AuthGuardService {
  constructor(
    private authRoleService: AuthRoleService,
    private router: Router
  ) {}
  
  canActivate(): boolean {
    if (this.authRoleService.isAuthenticated()) {
      return true;
    }
    
    // Redirect to login if not authenticated
    this.router.navigate(['/login']);
    return false;
  }
}

/**
 * Functional guard for authentication
 */
export const authGuard: CanActivateFn = () => {
  const guardService = inject(AuthGuardService);
  return guardService.canActivate();
};
