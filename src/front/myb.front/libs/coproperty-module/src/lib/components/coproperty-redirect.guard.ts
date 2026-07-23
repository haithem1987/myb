import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from '@myb-front/auth';

/**
 * Dispatch guard for `/coproperty` (no UI render).
 *
 * Routes the user to the correct role-based dashboard based on their
 * Keycloak roles. Replaces the previous intermediate spinner component.
 */
export const copropertyRedirectGuard: CanActivateFn = () => {
  const router = inject(Router);
  const keycloakService = inject(KeycloakService);

  const roles = keycloakService.getUserRoles();
  const hasSyndic =
    roles.includes('coproperty-syndic') || roles.includes('coproperty-admin');
  const hasOwner = roles.includes('coproperty-owner');

  if (hasSyndic && hasOwner) {
    return router.createUrlTree(['/home']);
  }

  if (hasSyndic) {
    return router.createUrlTree(['/coproperty/syndic/dashboard']);
  }
  if (roles.includes('coproperty-council')) {
    return router.createUrlTree(['/coproperty/council/dashboard']);
  }
  if (roles.includes('coproperty-accountant')) {
    return router.createUrlTree(['/coproperty/accountant/dashboard']);
  }
  if (hasOwner) {
    return router.createUrlTree(['/coproperty/owner/dashboard']);
  }
  if (roles.includes('system-admin')) {
    return router.createUrlTree(['/coproperty/syndic/dashboard']);
  }

  return router.createUrlTree(['/access-denied']);
};
