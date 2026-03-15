import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { OwnerService } from '../services/owner.service';
import { firstValueFrom } from 'rxjs';

/**
 * Guard that ensures an authenticated user has completed their owner profile.
 * If the user is not authenticated → redirect to /register (pick auth method there).
 * If authenticated but no owner profile → redirect to /register/complete-profile.
 */
export const profileGuard: CanActivateFn = async (_route, _state) => {
  const keycloakService = inject(KeycloakService);
  const ownerService = inject(OwnerService);
  const router = inject(Router);

  const isAuthenticated = keycloakService.isAuthenticated();

  if (!isAuthenticated) {
    // Redirect to registration page — user can log in from there via the login link
    return router.createUrlTree(['/register']);
  }

  const userId = keycloakService.getUserId();
  if (!userId) {
    return router.createUrlTree(['/access-denied']);
  }

  try {
    const owner = await firstValueFrom(ownerService.getOwnerByUserId(userId));
    if (!owner) {
      // Profile not yet created → send to completion page
      return router.createUrlTree(['/register/complete-profile']);
    }
    return true;
  } catch {
    // GraphQL error (e.g. owner not found) → redirect to completion
    return router.createUrlTree(['/register/complete-profile']);
  }
};

/**
 * Guard for the /register/complete-profile route.
 * If NOT authenticated → redirect to /register (NOT Keycloak login) so user picks method.
 * If authenticated and profile already exists → redirect to owner dashboard.
 */
export const completeProfileGuard: CanActivateFn = async () => {
  const keycloakService = inject(KeycloakService);
  const ownerService = inject(OwnerService);
  const router = inject(Router);

  const isAuthenticated = keycloakService.isAuthenticated();
  if (!isAuthenticated) {
    // Send back to registration page — let the user pick Email or Google
    return router.createUrlTree(['/register']);
  }

  // Already authenticated — check if profile exists
  const userId = keycloakService.getUserId();
  if (!userId) return true; // let the component handle missing userId

  try {
    const owner = await firstValueFrom(ownerService.getOwnerByUserId(userId));
    if (owner) {
      // Profile already completed → go to dashboard
      return router.createUrlTree(['/coproperty/owner']);
    }
    return true; // authenticated, no profile yet → show the form
  } catch {
    return true; // error fetching → let user complete profile
  }
};

/**
 * Guard that prevents already-registered owners from accessing the registration page.
 * If authenticated and profile exists → redirect to owner dashboard.
 */
export const noProfileGuard: CanActivateFn = async () => {
  const keycloakService = inject(KeycloakService);
  const ownerService = inject(OwnerService);
  const router = inject(Router);

  const isAuthenticated = keycloakService.isAuthenticated();
  if (!isAuthenticated) return true; // not logged in → allow register page

  const userId = keycloakService.getUserId();
  if (!userId) return true;

  try {
    const owner = await firstValueFrom(ownerService.getOwnerByUserId(userId));
    if (owner) {
      // Already has a profile → go straight to dashboard
      return router.createUrlTree(['/coproperty/owner']);
    }
    return true;
  } catch {
    return true;
  }
};
