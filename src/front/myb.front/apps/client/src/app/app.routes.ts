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
    path: 'invoices',
    loadComponent: () =>
      import('@myb-front/invoice-module').then((c) => c.InvoiceModuleComponent),
  },
  {
    path: 'timesheet',
    loadComponent: () =>
      import('@myb-front/time-sheet-module').then(
        (c) => c.TimeSheetModuleComponent
      ),
  },
];
