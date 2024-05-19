import { Route } from '@angular/router';
import { authGuard } from 'libs/auth/src/lib/auth.guard';
export const appRoutes: Route[] = [
  // {
  //   path: 'home',
  //   canActivate: [authGuard],
  //   component: LandingPageComponent,
  // },
  {
    path: '',
    loadComponent: () =>
      import('@myb-front/shared-ui').then((c) => c.LandingPageComponent),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('@myb-front/shared-ui').then((c) => c.UserCRUDComponent),
  },
  {
    path: 'timesheet',
    loadChildren: () =>
      import('@myb-front/time-sheet-module').then(
        (c) => c.TimesheetRoutingModule
      ),
  },
  {
    path: 'documents',
    loadComponent: () =>
      import('@myb-front/doc-management-module').then(
        (c) => c.DocManagementModuleComponent
      ),
  },
];
