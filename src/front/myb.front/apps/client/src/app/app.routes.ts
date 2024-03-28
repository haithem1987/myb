import { Route } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { authGuard } from 'libs/auth/src/lib/keycloack/auth.guard';
export const appRoutes: Route[] = [
  { path: '', component: HomeComponent },
  // {path :'login', loadComponent: ()=>import('@myb-front/auth').then((c)=>c.LoginComponent)},
  {
    path: 'modules',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./module/module-ui.component').then((c) => c.ModuleUiComponent),
  },
  {
    path: 'modulesNew',
    loadComponent: () =>
      import('./module/module-ui.component').then((c) => c.ModuleUiComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('@myb-front/auth').then((c) => c.RegisterComponent),
  },
];
