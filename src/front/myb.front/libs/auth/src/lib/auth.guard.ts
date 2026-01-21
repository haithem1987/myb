import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from './keycloak.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const keycloakService = inject(KeycloakService);
  const router = inject(Router);

  try {
    // Wait for Keycloak to initialize
    const initialized = await keycloakService.init();

    if (!initialized || !keycloakService.isAuthenticated()) {
      console.log('User not authenticated, redirecting to login');
      // Redirect to Keycloak login
      keycloakService.login();
      return false;
    }

    console.log('User authenticated:', keycloakService.isAuthenticated());
    return true;
  } catch (error) {
    console.error('Auth guard error:', error);
    return router.createUrlTree(['/access-denied']);
  }
};
