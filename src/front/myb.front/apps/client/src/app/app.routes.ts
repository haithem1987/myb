import { Route } from '@angular/router';
import { authGuard } from 'libs/auth/src/lib/auth.guard';
import { completeProfileGuard, keycloakRegistrationGuard } from 'libs/coproperty-module/src/lib/guards/profile.guard';
export const appRoutes: Route[] = [
  {
    path: '',
    title: 'MYB | Gestion de copropriété',
    loadComponent: () =>
      import('@myb-front/shared-ui').then((c) => c.HomePageComponent),
  },

  // ─── Owner Self-Registration Flow ───────────────────────────────────────────
  {
    path: 'register',
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [keycloakRegistrationGuard],
        children: [],
      },
      {
        path: 'complete-profile',
        canActivate: [completeProfileGuard],
        loadComponent: () =>
          import('@myb-front/coproperty-module').then(
            (m) => m.OwnerProfileCompletionComponent
          ),
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────────────

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
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@myb-front/shared-ui').then((c) => c.ProfilePageComponent),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('@myb-front/shared-ui').then((c) => c.ContactPageComponent),
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('@myb-front/shared-ui').then((c) => c.TermsPageComponent),
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('@myb-front/shared-ui').then((c) => c.PrivacyPageComponent),
  },
  {
    path: 'docs',
    title: 'Documentation MYB',
    loadComponent: () =>
      import('@myb-front/shared-ui').then((c) => c.DocsPageComponent),
  },
  // {
    // path:'folder/:id' , component:FolderDetailsComponent
  // }
];
