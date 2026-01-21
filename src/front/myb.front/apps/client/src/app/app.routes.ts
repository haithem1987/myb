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
    path: 'invoice',
    canActivate: [authGuard],
    loadChildren: () =>
      import('@myb-front/invoice-module').then((c) => c.InvoiceRoutingModule),
  },
  {
    path: 'timesheet',
    canActivate: [authGuard],
    loadChildren: () =>
      import('@myb-front/time-sheet-module').then(
        (c) => c.TimesheetRoutingModule
      ),
  },
  {
    path: 'documents',
    canActivate: [authGuard],
    loadChildren: () =>
      import('@myb-front/doc-management-module').then(
        (m) => m.DocumentroutingModule
      ),
  },
  {
    path: 'coproperty',
    canActivate: [authGuard],
    loadChildren: () =>
      import('@myb-front/coproperty-module').then(
        (m) => m.COPROPERTY_ROUTES
      ),
  },
  {
    path: 'subscriptions',
    loadComponent: () =>
      import('@myb-front/shared-ui').then((c) => c.SubscriptionsComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'coproperties',
        pathMatch: 'full',
      },
      {
        path: 'coproperties',
        loadChildren: () =>
          import('@myb-front/coproperty-module').then(
            (m) => m.COPROPERTY_ROUTES
          ),
      },
      {
        path: 'owner',
        loadComponent: () =>
          import('@myb-front/coproperty-module').then(
            (m) => m.OwnerDashboardComponent
          ),
      },
    ],
  },
  {
    path: 'access-denied',
    loadComponent: () =>
      import('@myb-front/shared-ui').then((c) => c.AccessDeniedPageComponent),
  },
  // {
  //   path:'folder/:id' , component:FolderDetailsComponent
  // }
];
