import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from '@myb-front/auth';

export const communicationHubGuard: CanActivateFn = () => {
  const keycloakService = inject(KeycloakService);
  const router = inject(Router);
  const roles = keycloakService.getUserRoles();
  const allowed = ['coproperty-syndic', 'coproperty-admin', 'system-admin'];
  if (allowed.some(r => roles.includes(r))) return true;
  return router.createUrlTree(['/access-denied']);
};
