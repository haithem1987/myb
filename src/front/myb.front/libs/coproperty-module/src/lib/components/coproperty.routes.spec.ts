import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { COPROPERTY_ROUTES } from './coproperty.routes';
import { CopropertyComponent } from './coproperty.component';
import { CopropertyListComponent } from './coproperty-list.component';
import { CopropertyDetailComponent } from './coproperty-detail.component';
import { CopropertyDashboardComponent } from './dashboard/coproperty-dashboard.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';

describe('COPROPERTY_ROUTES', () => {
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CopropertyComponent,
        CopropertyListComponent,
        CopropertyDetailComponent,
        CopropertyDashboardComponent,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideRouter(COPROPERTY_ROUTES),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  it('should navigate to dashboard on empty path', async () => {
    await router.navigate(['']);
    expect(location.path()).toBe('/');
  });

  it('should navigate to coproperty list', async () => {
    await router.navigate(['coproperties']);
    expect(location.path()).toBe('/coproperties');
  });

  it('should navigate to coproperty detail with id', async () => {
    const testId = 'test-id-123';
    await router.navigate(['coproperties', testId]);
    expect(location.path()).toBe(`/coproperties/${testId}`);
  });

  it('should navigate to coproperty edit with id', async () => {
    const testId = 'test-id-456';
    await router.navigate(['coproperties', testId, 'edit']);
    expect(location.path()).toBe(`/coproperties/${testId}/edit`);
  });

  it('should have correct route configuration structure', () => {
    expect(COPROPERTY_ROUTES).toBeDefined();
    expect(COPROPERTY_ROUTES.length).toBe(1);
    expect(COPROPERTY_ROUTES[0].path).toBe('');
    expect(COPROPERTY_ROUTES[0].component).toBe(CopropertyComponent);
    expect(COPROPERTY_ROUTES[0].children).toBeDefined();
    expect(COPROPERTY_ROUTES[0].children?.length).toBe(4);
  });

  it('should have dashboard as default child route', () => {
    const dashboardRoute = COPROPERTY_ROUTES[0].children?.find(
      (r) => r.path === ''
    );
    expect(dashboardRoute).toBeDefined();
    expect(dashboardRoute?.component).toBe(CopropertyDashboardComponent);
  });

  it('should have coproperty list route configured', () => {
    const listRoute = COPROPERTY_ROUTES[0].children?.find(
      (r) => r.path === 'coproperties'
    );
    expect(listRoute).toBeDefined();
    expect(listRoute?.component).toBe(CopropertyListComponent);
  });

  it('should have coproperty detail route with id parameter', () => {
    const detailRoute = COPROPERTY_ROUTES[0].children?.find(
      (r) => r.path === 'coproperties/:id'
    );
    expect(detailRoute).toBeDefined();
    expect(detailRoute?.component).toBe(CopropertyDetailComponent);
  });

  it('should have coproperty edit route with id parameter', () => {
    const editRoute = COPROPERTY_ROUTES[0].children?.find(
      (r) => r.path === 'coproperties/:id/edit'
    );
    expect(editRoute).toBeDefined();
    expect(editRoute?.component).toBe(CopropertyDetailComponent);
  });
});
