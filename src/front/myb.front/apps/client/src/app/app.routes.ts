import { DocumentroutingModule } from './../../../../libs/doc-management-module/src/lib/document-routing-module';
import { Route } from '@angular/router';
import {
  DocManagementModuleComponent,
  FolderDetailsComponent,
} from '@myb-front/doc-management-module';
import { AccessDeniedPageComponent } from '@myb-front/shared-ui';
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
    path: 'subscriptions',
    loadComponent: () =>
      import('@myb-front/shared-ui').then((c) => c.SubscriptionsComponent),
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
