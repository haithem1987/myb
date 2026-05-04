import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { OwnerService } from '../services/owner.service';
import { firstValueFrom } from 'rxjs';

/** Syndic/manager roles that bypass the owner-portal and go to the syndic dashboard. */
const SYNDIC_ROLES = ['coproperty-syndic', 'coproperty-admin', 'system-admin'] as const;

/**
 * Returns the default post-login route based on Keycloak roles.
 * NOTE: Only used by profileGuard (protecting existing dashboard routes).
 * The register/complete-profile flow always routes to the owner dashboard.
 */
function getDefaultRoute(keycloakService: KeycloakService): string {
  const roles = keycloakService.getUserRoles();
  const isSyndic = roles.some(r => (SYNDIC_ROLES as readonly string[]).includes(r));
  return isSyndic ? '/coproperty/syndic/dashboard' : '/coproperty/owner/dashboard';
}

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
    const result = await firstValueFrom(ownerService.getOwnerByUserIdRaw(userId));
    // Only redirect to complete-profile when the API confirms there is no owner
    // (null data with no errors). Backend/network errors are treated as "unknown" —
    // allow through so the dashboard can display a graceful error state.
    if (result.errors && result.errors.length > 0) {
      console.warn('[profileGuard] Backend error checking owner profile, allowing access:', result.errors);
      return true;
    }
    if (!result.data) {
      return router.createUrlTree(['/register/complete-profile']);
    }
    return true;
  } catch {
    // Network-level error — allow access rather than falsely blocking the user
    console.warn('[profileGuard] Network error checking owner profile, allowing access');
    return true;
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
      // Profile already completed — the complete-profile flow is owner-only,
      // so always redirect to the owner dashboard.
      return router.createUrlTree(['/coproperty/owner/dashboard']);
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
      // Already has a profile → redirect to owner dashboard
      return router.createUrlTree(['/coproperty/owner/dashboard']);
    }
    return true;
  } catch {
    return true;
  }
};
