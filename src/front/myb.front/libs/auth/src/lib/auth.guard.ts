import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from './keycloak.service';

export const authGuard: CanActivateFn = (route, state) => {
  const keycloakService = inject(KeycloakService);
  const router = inject(Router);

  // Initialize Keycloak, if it's not already initialized
  // const initialized = await keycloakService.init();

  // if (!initialized) {
  //   // If initialization failed, or the user is not authenticated
  //   return router.createUrlTree(['/access-denied']);
  // }

  // Check if the user is authenticated
  if (keycloakService.isAuthenticated()) {
    console.log(
      'keycloakService.isAuthenticated()',
      keycloakService.isAuthenticated()
    );
    return true;
  } else {
    // Redirect to the access-denied page if not authenticated
    return router.createUrlTree(['/access-denied']);
  }
};
