import { DocumentroutingModule } from './../../../../libs/doc-management-module/src/lib/document-routing-module';
import { Route } from '@angular/router';
import {
  DocManagementModuleComponent,
  FolderDetailsComponent,
} from '@myb-front/doc-management-module';
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
    loadChildren: () =>
      import('@myb-front/invoice-module').then((c) => c.InvoiceRoutingModule),
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
    loadChildren: () =>
      import('@myb-front/doc-management-module').then(
        (m) => m.DocumentroutingModule
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('@myb-front/shared-ui').then((c) => c.SettingsComponent),
  },
  // {
  //   path:'folder/:id' , component:FolderDetailsComponent
  // }
];
