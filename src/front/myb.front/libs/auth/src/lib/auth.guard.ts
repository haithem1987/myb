import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from './keycloak.service';

export const authGuard: CanActivateFn = (route, state) => {
  const keycloakService = inject(KeycloakService);
  const router = inject(Router);

  // const initialized = await keycloakService.init();

  // if (!initialized) {
  //   // If initialization failed, or the user is not authenticated
  //   return router.createUrlTree(['/access-denied']);
  // }

  if (keycloakService.isAuthenticated()) {
    console.log(
      'keycloakService.isAuthenticated()',
      keycloakService.isAuthenticated()
    );
    return true;
  } else {
    return router.createUrlTree(['/access-denied']);
  }
};
