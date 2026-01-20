import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('App Routes - Admin Coproperty Configuration', () => {
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(appRoutes),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  it('should have admin route configured', () => {
    const adminRoute = appRoutes.find((r) => r.path === 'admin');
    expect(adminRoute).toBeDefined();
    expect(adminRoute?.canActivate).toBeDefined();
    expect(adminRoute?.children).toBeDefined();
  });

  it('should have admin/coproperties child route', () => {
    const adminRoute = appRoutes.find((r) => r.path === 'admin');
    const copropertiesRoute = adminRoute?.children?.find(
      (r) => r.path === 'coproperties'
    );
    expect(copropertiesRoute).toBeDefined();
    expect(copropertiesRoute?.loadChildren).toBeDefined();
  });

  it('should have separate coproperty route', () => {
    const copropertyRoute = appRoutes.find((r) => r.path === 'coproperty');
    expect(copropertyRoute).toBeDefined();
    expect(copropertyRoute?.canActivate).toBeDefined();
    expect(copropertyRoute?.loadChildren).toBeDefined();
  });

  it('should have all required main routes', () => {
    const requiredPaths = [
      '',
      'users',
      'invoice',
      'timesheet',
      'documents',
      'coproperty',
      'subscriptions',
      'admin',
      'access-denied',
    ];

    requiredPaths.forEach((path) => {
      const route = appRoutes.find((r) => r.path === path);
      expect(route).toBeDefined();
    });
  });

  it('should lazy load invoice module', () => {
    const invoiceRoute = appRoutes.find((r) => r.path === 'invoice');
    expect(invoiceRoute?.loadChildren).toBeDefined();
  });

  it('should lazy load timesheet module', () => {
    const timesheetRoute = appRoutes.find((r) => r.path === 'timesheet');
    expect(timesheetRoute?.loadChildren).toBeDefined();
  });

  it('should lazy load documents module', () => {
    const documentsRoute = appRoutes.find((r) => r.path === 'documents');
    expect(documentsRoute?.loadChildren).toBeDefined();
  });

  it('should lazy load coproperty module', () => {
    const copropertyRoute = appRoutes.find((r) => r.path === 'coproperty');
    expect(copropertyRoute?.loadChildren).toBeDefined();
  });

  it('should lazy load admin coproperty module', () => {
    const adminRoute = appRoutes.find((r) => r.path === 'admin');
    const copropertiesRoute = adminRoute?.children?.find(
      (r) => r.path === 'coproperties'
    );
    expect(copropertiesRoute?.loadChildren).toBeDefined();
  });

  it('should protect admin routes with authGuard', () => {
    const adminRoute = appRoutes.find((r) => r.path === 'admin');
    expect(adminRoute?.canActivate).toBeDefined();
    expect(adminRoute?.canActivate?.length).toBeGreaterThan(0);
  });

  it('should protect coproperty routes with authGuard', () => {
    const copropertyRoute = appRoutes.find((r) => r.path === 'coproperty');
    expect(copropertyRoute?.canActivate).toBeDefined();
    expect(copropertyRoute?.canActivate?.length).toBeGreaterThan(0);
  });

  it('should have access-denied route without guard', () => {
    const accessDeniedRoute = appRoutes.find(
      (r) => r.path === 'access-denied'
    );
    expect(accessDeniedRoute).toBeDefined();
    expect(accessDeniedRoute?.canActivate).toBeUndefined();
  });
});
