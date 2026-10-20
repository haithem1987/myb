import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { profileGuard, noProfileGuard, completeProfileGuard, keycloakRegistrationGuard } from './profile.guard';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { OwnerService } from '../services/owner.service';

describe('profile.guard', () => {
  const keycloakMock = {
    isAuthenticated: jest.fn(),
    getUserId: jest.fn(),
    getUserRoles: jest.fn(() => []),
    login: jest.fn(),
    registerWithRedirect: jest.fn(),
  };

  const ownerServiceMock = {
    getOwnerByUserId: jest.fn(),
    getOwnerByUserIdRaw: jest.fn(),
  };

  const routerMock = {
    createUrlTree: jest.fn((commands: any[], extras?: any) => ({ commands, extras })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: KeycloakService, useValue: keycloakMock },
        { provide: OwnerService, useValue: ownerServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  // ── noProfileGuard ────────────────────────────────────────────────────────

  describe('noProfileGuard', () => {
    it('COP-RG-004 — allows unauthenticated users through (registration page stays visible)', async () => {
      keycloakMock.isAuthenticated.mockReturnValue(false);
      const result = await TestBed.runInInjectionContext(() => noProfileGuard({} as any, {} as any));
      expect(result).toBe(true);
    });

    it('COP-RG-005 — redirects authenticated user who already has a profile to owner dashboard', async () => {
      keycloakMock.isAuthenticated.mockReturnValue(true);
      keycloakMock.getUserId.mockReturnValue('user-1');
      ownerServiceMock.getOwnerByUserId.mockReturnValue(of({ id: 'owner-1', userId: 'user-1' }));

      const result = await TestBed.runInInjectionContext(() => noProfileGuard({} as any, {} as any));

      expect(routerMock.createUrlTree).toHaveBeenCalledWith(
        ['/coproperty/select'],
        expect.objectContaining({ queryParams: { space: 'owner' } })
      );
      expect(result).not.toBe(true);
    });

    it('allows authenticated user with no profile to proceed', async () => {
      keycloakMock.isAuthenticated.mockReturnValue(true);
      keycloakMock.getUserId.mockReturnValue('user-1');
      ownerServiceMock.getOwnerByUserId.mockReturnValue(of(null));

      const result = await TestBed.runInInjectionContext(() => noProfileGuard({} as any, {} as any));
      expect(result).toBe(true);
    });

    it('allows access when an error occurs (fail-open)', async () => {
      keycloakMock.isAuthenticated.mockReturnValue(true);
      keycloakMock.getUserId.mockReturnValue('user-1');
      ownerServiceMock.getOwnerByUserId.mockReturnValue(throwError(() => new Error('network')));

      const result = await TestBed.runInInjectionContext(() => noProfileGuard({} as any, {} as any));
      expect(result).toBe(true);
    });
  });

  // ── profileGuard ──────────────────────────────────────────────────────────

  describe('profileGuard', () => {
    it('COP-PF-001 — initiates Keycloak login when user is not authenticated', async () => {
      keycloakMock.isAuthenticated.mockReturnValue(false);

      const result = await TestBed.runInInjectionContext(() => profileGuard({} as any, {} as any));

      expect(keycloakMock.login).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('redirects to /access-denied when userId is missing', async () => {
      keycloakMock.isAuthenticated.mockReturnValue(true);
      keycloakMock.getUserId.mockReturnValue(null);

      await TestBed.runInInjectionContext(() => profileGuard({} as any, {} as any));

      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/access-denied']);
    });

    it('COP-RG-002 — redirects to complete-profile when no owner profile exists', async () => {
      keycloakMock.isAuthenticated.mockReturnValue(true);
      keycloakMock.getUserId.mockReturnValue('user-1');
      ownerServiceMock.getOwnerByUserIdRaw.mockReturnValue(of({ data: null, errors: undefined }));

      await TestBed.runInInjectionContext(() => profileGuard({} as any, {} as any));

      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/register/complete-profile']);
    });

    it('allows access when owner profile exists', async () => {
      keycloakMock.isAuthenticated.mockReturnValue(true);
      keycloakMock.getUserId.mockReturnValue('user-1');
      ownerServiceMock.getOwnerByUserIdRaw.mockReturnValue(of({ data: { id: 'owner-1' }, errors: undefined }));

      const result = await TestBed.runInInjectionContext(() => profileGuard({} as any, {} as any));
      expect(result).toBe(true);
    });

    it('COP-KC-004 — allows access when backend returns errors (fail-open, no partial block)', async () => {
      keycloakMock.isAuthenticated.mockReturnValue(true);
      keycloakMock.getUserId.mockReturnValue('user-1');
      ownerServiceMock.getOwnerByUserIdRaw.mockReturnValue(
        of({ data: null, errors: [{ message: 'Internal server error' }] })
      );

      const result = await TestBed.runInInjectionContext(() => profileGuard({} as any, {} as any));
      expect(result).toBe(true);
    });

    it('allows access when a network error is thrown (fail-open)', async () => {
      keycloakMock.isAuthenticated.mockReturnValue(true);
      keycloakMock.getUserId.mockReturnValue('user-1');
      ownerServiceMock.getOwnerByUserIdRaw.mockReturnValue(throwError(() => new Error('network')));

      const result = await TestBed.runInInjectionContext(() => profileGuard({} as any, {} as any));
      expect(result).toBe(true);
    });
  });

  // ── completeProfileGuard ──────────────────────────────────────────────────

  describe('completeProfileGuard', () => {
    it('redirects to Keycloak login when not authenticated', async () => {
      keycloakMock.isAuthenticated.mockReturnValue(false);

      const result = await TestBed.runInInjectionContext(() => completeProfileGuard({} as any, {} as any));

      expect(keycloakMock.login).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('COP-RG-006 — redirects to /coproperty/select when profile already completed', async () => {
      keycloakMock.isAuthenticated.mockReturnValue(true);
      keycloakMock.getUserId.mockReturnValue('user-1');
      ownerServiceMock.getOwnerByUserId.mockReturnValue(of({ id: 'owner-1' }));

      await TestBed.runInInjectionContext(() => completeProfileGuard({} as any, {} as any));

      expect(routerMock.createUrlTree).toHaveBeenCalledWith(
        ['/coproperty/select'],
        expect.objectContaining({ queryParams: { space: 'owner' } })
      );
    });

    it('allows through when no profile exists yet', async () => {
      keycloakMock.isAuthenticated.mockReturnValue(true);
      keycloakMock.getUserId.mockReturnValue('user-1');
      ownerServiceMock.getOwnerByUserId.mockReturnValue(of(null));

      const result = await TestBed.runInInjectionContext(() => completeProfileGuard({} as any, {} as any));
      expect(result).toBe(true);
    });
  });

  // ── keycloakRegistrationGuard ─────────────────────────────────────────────

  describe('keycloakRegistrationGuard', () => {
    it('redirects authenticated user to complete-profile', () => {
      keycloakMock.isAuthenticated.mockReturnValue(true);

      TestBed.runInInjectionContext(() => keycloakRegistrationGuard({} as any, {} as any));

      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/register/complete-profile']);
    });

    it('calls registerWithRedirect for unauthenticated visitors', () => {
      keycloakMock.isAuthenticated.mockReturnValue(false);

      const result = TestBed.runInInjectionContext(() => keycloakRegistrationGuard({} as any, {} as any));

      expect(keycloakMock.registerWithRedirect).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});
