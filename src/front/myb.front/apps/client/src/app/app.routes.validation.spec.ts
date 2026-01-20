/**
 * Admin Coproperty Routes Validation Test
 * 
 * This test file validates the routing configuration for admin coproperty management.
 * It verifies that:
 * 1. The admin route exists and is properly configured
 * 2. The coproperty child route under admin loads correctly
 * 3. The COPROPERTY_ROUTES are properly exported and structured
 * 4. Both /coproperty and /admin/coproperties routes are configured
 */

import { appRoutes } from './app.routes';
import { COPROPERTY_ROUTES } from '@myb-front/coproperty-module';

describe('Admin Coproperty Routes Validation', () => {
  describe('App Routes Structure', () => {
    test('should export appRoutes array', () => {
      expect(Array.isArray(appRoutes)).toBe(true);
      expect(appRoutes.length).toBeGreaterThan(0);
    });

    test('should have admin route configured', () => {
      const adminRoute = appRoutes.find((r) => r.path === 'admin');
      expect(adminRoute).toBeDefined();
      expect(adminRoute?.path).toBe('admin');
    });

    test('admin route should have auth guard', () => {
      const adminRoute = appRoutes.find((r) => r.path === 'admin');
      expect(adminRoute?.canActivate).toBeDefined();
      expect(Array.isArray(adminRoute?.canActivate)).toBe(true);
    });

    test('admin route should have children', () => {
      const adminRoute = appRoutes.find((r) => r.path === 'admin');
      expect(adminRoute?.children).toBeDefined();
      expect(Array.isArray(adminRoute?.children)).toBe(true);
    });

    test('admin route should have coproperties child', () => {
      const adminRoute = appRoutes.find((r) => r.path === 'admin');
      const copropertiesChild = adminRoute?.children?.find(
        (c) => c.path === 'coproperties'
      );
      expect(copropertiesChild).toBeDefined();
      expect(copropertiesChild?.path).toBe('coproperties');
    });

    test('coproperties child should lazy load module', () => {
      const adminRoute = appRoutes.find((r) => r.path === 'admin');
      const copropertiesChild = adminRoute?.children?.find(
        (c) => c.path === 'coproperties'
      );
      expect(copropertiesChild?.loadChildren).toBeDefined();
      expect(typeof copropertiesChild?.loadChildren).toBe('function');
    });

    test('should have standalone coproperty route', () => {
      const copropertyRoute = appRoutes.find((r) => r.path === 'coproperty');
      expect(copropertyRoute).toBeDefined();
      expect(copropertyRoute?.path).toBe('coproperty');
    });

    test('standalone coproperty route should have auth guard', () => {
      const copropertyRoute = appRoutes.find((r) => r.path === 'coproperty');
      expect(copropertyRoute?.canActivate).toBeDefined();
      expect(Array.isArray(copropertyRoute?.canActivate)).toBe(true);
    });

    test('standalone coproperty route should lazy load', () => {
      const copropertyRoute = appRoutes.find((r) => r.path === 'coproperty');
      expect(copropertyRoute?.loadChildren).toBeDefined();
      expect(typeof copropertyRoute?.loadChildren).toBe('function');
    });
  });

  describe('COPROPERTY_ROUTES Structure', () => {
    test('should export COPROPERTY_ROUTES array', () => {
      expect(Array.isArray(COPROPERTY_ROUTES)).toBe(true);
      expect(COPROPERTY_ROUTES.length).toBeGreaterThan(0);
    });

    test('should have root route with empty path', () => {
      const rootRoute = COPROPERTY_ROUTES[0];
      expect(rootRoute.path).toBe('');
    });

    test('root route should have component', () => {
      const rootRoute = COPROPERTY_ROUTES[0];
      expect(rootRoute.component).toBeDefined();
    });

    test('root route should have children', () => {
      const rootRoute = COPROPERTY_ROUTES[0];
      expect(rootRoute.children).toBeDefined();
      expect(Array.isArray(rootRoute.children)).toBe(true);
      expect(rootRoute.children!.length).toBeGreaterThan(0);
    });

    test('should have dashboard route (empty path child)', () => {
      const rootRoute = COPROPERTY_ROUTES[0];
      const dashboardRoute = rootRoute.children?.find((c) => c.path === '');
      expect(dashboardRoute).toBeDefined();
      expect(dashboardRoute?.component).toBeDefined();
    });

    test('should have coproperties list route', () => {
      const rootRoute = COPROPERTY_ROUTES[0];
      const listRoute = rootRoute.children?.find(
        (c) => c.path === 'coproperties'
      );
      expect(listRoute).toBeDefined();
      expect(listRoute?.component).toBeDefined();
    });

    test('should have coproperties detail route with id param', () => {
      const rootRoute = COPROPERTY_ROUTES[0];
      const detailRoute = rootRoute.children?.find(
        (c) => c.path === 'coproperties/:id'
      );
      expect(detailRoute).toBeDefined();
      expect(detailRoute?.component).toBeDefined();
    });

    test('should have coproperties edit route with id param', () => {
      const rootRoute = COPROPERTY_ROUTES[0];
      const editRoute = rootRoute.children?.find(
        (c) => c.path === 'coproperties/:id/edit'
      );
      expect(editRoute).toBeDefined();
      expect(editRoute?.component).toBeDefined();
    });
  });

  describe('Route Paths Configuration', () => {
    test('all main routes should be unique', () => {
      const paths = appRoutes.map((r) => r.path);
      const uniquePaths = new Set(paths);
      expect(paths.length).toBe(uniquePaths.size);
    });

    test('should not have nested objects in route array', () => {
      // Ensure no route has a malformed structure with nested objects
      appRoutes.forEach((route, index) => {
        expect(route).toHaveProperty('path');
        // Routes should have either component, loadComponent, loadChildren, or children
        const hasValidConfig =
          route.hasOwnProperty('component') ||
          route.hasOwnProperty('loadComponent') ||
          route.hasOwnProperty('loadChildren') ||
          route.hasOwnProperty('children');
        expect(hasValidConfig).toBe(true);
      });
    });

    test('required routes should exist', () => {
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
  });

  describe('Async Loading Configuration', () => {
    test('coproperty loadChildren should be async function', async () => {
      const copropertyRoute = appRoutes.find((r) => r.path === 'coproperty');
      expect(typeof copropertyRoute?.loadChildren).toBe('function');

      if (copropertyRoute?.loadChildren) {
        const module = await copropertyRoute.loadChildren();
        expect(module).toBeDefined();
      }
    });

    test('admin coproperties loadChildren should be async function', async () => {
      const adminRoute = appRoutes.find((r) => r.path === 'admin');
      const copropertiesChild = adminRoute?.children?.find(
        (c) => c.path === 'coproperties'
      );
      expect(typeof copropertiesChild?.loadChildren).toBe('function');

      if (copropertiesChild?.loadChildren) {
        const module = await copropertiesChild.loadChildren();
        expect(module).toBeDefined();
      }
    });
  });
});
