import { Route } from '@angular/router';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home/home.component';
import { authGuard } from 'libs/auth/src/lib/auth.guard';
import { AdminHomeComponent } from './admin-home/admin-home.component';
import { environment } from '../environments/environment';
import { KeycloakService } from '@myb-front/auth';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 3rem; text-align: center; max-width: 600px; margin: 0 auto;">
      <div style="font-size: 4rem; margin-bottom: 1rem;">
        <i class="bi bi-shield-lock" style="color: #dc3545;"></i>
      </div>
      <h1 style="color: #1a202c; margin-bottom: 0.5rem;">Accès refusé</h1>
      <p style="color: #6c757d; font-size: 1.1rem;">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
      </p>
      <div *ngIf="userRoles.length > 0" style="margin: 1.5rem 0; padding: 1rem; background: #f8f9fa; border-radius: 8px; text-align: left;">
        <strong>Vos rôles actuels :</strong>
        <div style="margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.5rem;">
          <span *ngFor="let role of userRoles"
                style="background: #e9ecef; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">
            {{ role }}
          </span>
        </div>
      </div>
      <p *ngIf="userRoles.length === 0" style="color: #dc3545; font-size: 0.9rem;">
        Aucun rôle attribué. Contactez votre administrateur pour obtenir un accès.
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;">
        <button (click)="goHome()" style="padding: 0.75rem 1.5rem; cursor: pointer; background: #0d6efd; color: white; border: none; border-radius: 8px; font-size: 1rem;">
          <i class="bi bi-house me-1"></i> Accueil
        </button>
        <button (click)="login()" style="padding: 0.75rem 1.5rem; cursor: pointer; background: #6c757d; color: white; border: none; border-radius: 8px; font-size: 1rem;">
          <i class="bi bi-box-arrow-in-right me-1"></i> Se reconnecter
        </button>
      </div>
    </div>
  `,
})
export class AccessDeniedComponent {
  private keycloakService = inject(KeycloakService);
  userRoles: string[] = [];

  constructor() {
    try {
      this.userRoles = this.keycloakService.getUserRoles().filter(r =>
        r.startsWith('coproperty-') || r === 'system-admin'
      );
    } catch { /* not logged in */ }
  }

  login() {
    this.keycloakService.login();
  }

  goHome() {
    window.location.href = '/';
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
