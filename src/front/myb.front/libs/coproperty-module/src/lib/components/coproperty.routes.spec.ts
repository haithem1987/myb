import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { COPROPERTY_ROUTES } from './coproperty.routes';
import { CopropertyDashboardComponent } from './dashboard/coproperty-dashboard.component';
import { CopropertyListComponent } from './coproperty-list.component';
import { CopropertyDetailComponent } from './coproperty-detail.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';

describe('COPROPERTY_ROUTES', () => {
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        provideRouter(COPROPERTY_ROUTES),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  it('should have correct top-level route configuration', () => {
    expect(COPROPERTY_ROUTES).toBeDefined();
    expect(COPROPERTY_ROUTES.length).toBeGreaterThan(0);

    // First route is the role-based dispatch guard
    expect(COPROPERTY_ROUTES[0].path).toBe('');

    // The syndic subroute exists with all expected children
    const syndicRoute = COPROPERTY_ROUTES.find((r) => r.path === 'syndic');
    expect(syndicRoute).toBeDefined();
    const expectedSyndicPaths = [
      'dashboard',
      'coproperties',
      'coproperties/new',
      'budgets',
      'units',
      'owners',
      'tenants',
      'maintenance',
      'interventions',
      'signalements',
      'discussions',
      'fund-calls',
      'charge-payments',
      'treasury',
      'unpaid-payments',
      'general-assembly',
      'reports',
      'settings',
    ];
    expectedSyndicPaths.forEach((p) => {
      const child = syndicRoute?.children?.find((c) => c.path === p);
      expect(child).toBeDefined();
    });
  });

  it('should have owner, council, and accountant subroutes', () => {
    expect(COPROPERTY_ROUTES.find((r) => r.path === 'owner')).toBeDefined();
    expect(COPROPERTY_ROUTES.find((r) => r.path === 'council')).toBeDefined();
    expect(COPROPERTY_ROUTES.find((r) => r.path === 'accountant')).toBeDefined();
  });

  it('should expose dashboard component at the empty syndic child', () => {
    const syndicRoute = COPROPERTY_ROUTES.find((r) => r.path === 'syndic');
    const dashboardChild = syndicRoute?.children?.find(
      (c) => c.path === 'dashboard',
    );
    expect(dashboardChild?.component).toBeDefined();
  });
});
