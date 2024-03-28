import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from './keycloack.service';

export const authGuard: CanActivateFn = (route, state) => {
  return inject(KeycloakService).isAuthenticated()
    ? true
    : inject(Router).createUrlTree(['/auth/login']);
};
