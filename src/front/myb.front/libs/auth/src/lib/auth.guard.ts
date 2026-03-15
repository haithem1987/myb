import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from './keycloak.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const keycloakService = inject(KeycloakService);
  const router = inject(Router);

  console.log('Auth guard checking authentication...');
  
  try {
    const isAuth = keycloakService.isAuthenticated();
    console.log('Is authenticated:', isAuth);
    
    if (!isAuth) {
      console.log('Not authenticated, storing URL and redirecting to login');
      // Store the attempted URL
      sessionStorage.setItem('redirect_url', state.url);
      
      // Don't call login in a loop - check if we just came back from Keycloak
      const hasKeycloakParams = window.location.search.includes('state=') || 
                               window.location.search.includes('session_state=') ||
                               window.location.search.includes('code=');
      
      if (hasKeycloakParams) {
        // We just came back from Keycloak but still not authenticated
        // This means initialization failed - show error
        console.error('Returned from Keycloak but not authenticated - check Keycloak configuration');
        return router.createUrlTree(['/access-denied']);
      }
      
      // First time - redirect to Keycloak, using the INTENDED URL as redirect URI
      keycloakService.login(window.location.origin + state.url);
      return false;
    }

    // Check required roles if specified in route data
    const requiredRoles = route.data?.['roles'] as string[] | undefined;
    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles = keycloakService.getUserRoles();
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      if (!hasRequiredRole) {
        console.warn('User does not have required roles:', requiredRoles, 'User roles:', userRoles);
        return router.createUrlTree(['/coproperty']);
      }
    }

    console.log('User authenticated, allowing access');
    return true;
  } catch (error) {
    console.error('Auth guard error:', error);
    return router.createUrlTree(['/access-denied']);
  }
};
