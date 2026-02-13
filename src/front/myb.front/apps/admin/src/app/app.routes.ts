import { Route } from '@angular/router';
import { Component, Inject } from '@angular/core';
import { HomeComponent } from './home/home.component';
import { authGuard } from 'libs/auth/src/lib/auth.guard';
import { AdminHomeComponent } from './admin-home/admin-home.component';
import { environment } from '../environments/environment';

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
    const keycloakUrl = environment.services.keycloak.url;
    const realm = environment.services.keycloak.realm;
    const clientId = environment.services.keycloak.clientId;
    window.location.href = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(window.location.origin)}&response_type=code&scope=openid`;
  }
}

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: AdminHomeComponent,
    canActivate: [authGuard],
  },
  {
    path: 'coproperty',
    canActivate: [authGuard],
    loadChildren: () => import('./coproperty/coproperty.routes').then(m => m.COPROPERTY_ROUTES),
  },
  {
    path: 'access-denied',
    component: AccessDeniedComponent,
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
