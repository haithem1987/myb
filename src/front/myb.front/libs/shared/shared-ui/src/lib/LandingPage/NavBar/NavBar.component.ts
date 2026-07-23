import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { KeycloakService } from '../../../../../../auth/src/lib/keycloak.service';
import { CounterService } from '../FeaturesSection/CounterService';
import { Subscription, filter } from 'rxjs';
import { UserDropdownComponent } from '../../components/user-dropdown/user-dropdown.component';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';
import { TranslateModule } from '@ngx-translate/core';

/** Roles that grant access to the Admin Portal (excludes pure syndic) */
const ADMIN_ROLES = ['system-admin', 'coproperty-admin'];

@Component({
  selector: 'myb-front-nav-bar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UserDropdownComponent,
    LanguageSwitcherComponent,
    TranslateModule,
  ],
  templateUrl: './NavBar.component.html',
  styleUrl: './NavBar.component.css',
})
export class NavBarComponent {
  limitedCount$ = this.counterService.counter$.pipe(
    filter((value) => value.count < 3)
  );

  constructor(
    public keycloakService: KeycloakService,
    public counterService: CounterService,
    private router: Router,
  ) {}

  /** Returns the admin app URL (same host, port 4201 in dev / /admin path in prod) */
  get adminPortalUrl(): string {
    const origin = window.location.origin;
    // In dev the admin app runs on port 4201; in prod it is on the same port
    if (origin.includes('localhost') || origin.match(/:\d+$/)) {
      return origin.replace(/:4200$/, ':4201');
    }
    // Production: admin is served at the same origin (docker nginx serves both)
    return origin + '/admin';
  }

  /** True when the logged-in user has at least one admin/syndic role */
  get isAdminUser(): boolean {
    if (!this.keycloakService.isAuthenticated()) return false;
    try {
      const roles = this.keycloakService.getUserRoles();
      return ADMIN_ROLES.some(r => roles.includes(r));
    } catch {
      return false;
    }
  }

  incrementCount() {
    this.counterService.increment();
  }

  onLogin(): void {
    this.keycloakService.login();
  }

  /** Navigate to the Angular registration page (Email / Google choice) */
  onRegister(): void {
    this.router.navigate(['/register']);
  }

  onLogout(): void {
    this.keycloakService.logout();
  }
}
