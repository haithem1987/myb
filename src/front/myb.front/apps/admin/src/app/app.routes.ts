import { Route } from '@angular/router';
import { authGuard } from '@myb/auth';
import { COPROPERTY_ROUTES } from '@myb/coproperty-module';

export const appRoutes: Route[] = [
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      {
        path: 'coproperties',
        loadChildren: () => import('@myb/coproperty-module').then(m => m.COPROPERTY_ROUTES),
      },
    ],
  },
  {
    path: '',
    redirectTo: '/admin/coproperties',
    pathMatch: 'full',
  },
];
