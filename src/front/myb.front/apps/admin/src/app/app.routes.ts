import { Route } from '@angular/router';
import { Component } from '@angular/core';
import { HomeComponent } from './home/home.component';
import { authGuard } from 'libs/auth/src/lib/auth.guard';

@Component({
  standalone: true,
  template: `
    <div style="padding: 2rem; text-align: center;">
      <h1>Access Denied</h1>
      <p>You are not authenticated. Please log in to access this application.</p>
      <button (click)="login()" style="padding: 0.5rem 1rem; cursor: pointer;">Login</button>
    </div>
  `,
})
export class AccessDeniedComponent {
  login() {
    window.location.href = 'http://localhost:8080/realms/MYB/protocol/openid-connect/auth?client_id=MYB-client&redirect_uri=' + encodeURIComponent(window.location.origin) + '&response_type=code&scope=openid';
  }
}

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('@myb-front/shared-ui').then((c) => c.LandingPageComponent),
  },
  {
    path: 'home',
    component: HomeComponent,
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
        loadChildren: () => import('@myb-front/coproperty-module').then(m => m.COPROPERTY_ROUTES),
      },
    ],
  },
  {
    path: 'access-denied',
    component: AccessDeniedComponent,
  },
];
