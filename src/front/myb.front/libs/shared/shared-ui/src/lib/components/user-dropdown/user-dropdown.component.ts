import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { ENVIRONMENT } from 'libs/auth/src/lib/environment.token';
import { KeycloakProfile } from 'keycloak-js';
import { Observable } from 'rxjs';
import { AvatarComponent } from '../avatar/avatar.component';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { SubscriptionService } from 'libs/shared/infra/services/subscription.service';

@Component({
  selector: 'myb-front-user-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbDropdownModule, AvatarComponent],
  templateUrl: './user-dropdown.component.html',
  styleUrl: './user-dropdown.component.css',
})
export class UserDropdownComponent implements OnInit {
  @Input() rootPath: string = '';
  user$: Observable<KeycloakProfile | null>;
  isSystemAdmin = false;
  isAdminApp = false;
  isCopropertyOwner = false;
  isCopropertyMember = false;
  hasSubscriptions = false;
  isProfilePage = false;
  isSubscriptionsPage = false;

  constructor(
    private keycloakService: KeycloakService,
    private subscriptionService: SubscriptionService,
    private router: Router,
    @Optional() @Inject(ENVIRONMENT) private environment: any
  ) {
    this.user$ = this.keycloakService.profile$;
  }

  ngOnInit(): void {
    if (this.keycloakService.isAuthenticated()) {
      this.user$ = this.keycloakService.profile$;
      this.isSystemAdmin = this.keycloakService.hasRole('system-admin');
      this.isCopropertyOwner = this.keycloakService.hasRole('coproperty-owner');
      this.isCopropertyMember = this.keycloakService.hasAnyRole([
        'coproperty-syndic',
        'coproperty-admin',
        'coproperty-council',
        'coproperty-accountant',
      ]);

      const userId = this.keycloakService.getProfile()?.id;
      if (userId) {
        this.subscriptionService.loadSubscriptions(userId).subscribe({
          next: (subs) => { this.hasSubscriptions = subs && subs.length > 0; },
          error: () => { this.hasSubscriptions = false; },
        });
      }
    }
    // Use environment config to reliably detect the current app.
    // Falls back to port-sniffing if ENVIRONMENT is not provided.
    this.isAdminApp = this.environment?.app?.currentApp === 'admin'
      ?? window.location.port === '4201';
    this.updateCurrentPage();
  }

  private updateCurrentPage(): void {
    const path = window.location.pathname;
    this.isProfilePage = path === '/profile' || path.startsWith('/profile/');
    this.isSubscriptionsPage = path === '/subscriptions' || path.startsWith('/subscriptions/');
  }

  /** URL of the client app — read from environment, safe in both dev and prod */
  private get clientAppUrl(): string {
    if (this.environment?.app?.clientUrl) {
      return this.environment.app.clientUrl;
    }
    // Legacy fallback: port-swap for local dev
    const origin = window.location.origin;
    if (window.location.port === '4201') return origin.replace(':4201', ':4200');
    if (window.location.port === '3001') return origin.replace(':3001', ':3000');
    if (window.location.port === '5201') return origin.replace(':5201', ':5200');
    return origin;
  }

  navigateToProfile(): void {
    window.location.href = this.clientAppUrl + '/profile';
  }

  navigateToSubscriptions(): void {
    window.location.href = this.clientAppUrl + '/subscriptions';
  }

  navigateToClientApp(): void {
    window.location.href = this.clientAppUrl;
  }

  logout(): void {
    // Redirect back to the current app's root after Keycloak logout.
    // Ensure this origin is added to the Keycloak client's "Valid post logout redirect URIs".
    this.keycloakService.logout(window.location.origin);
  }

  getAvatarColor(username: string): string {
    const colors = [
      '#FFB6C1',
      '#FF69B4',
      '#FF1493',
      '#DB7093',
      '#C71585',
      '#FFA07A',
      '#FA8072',
      '#E9967A',
      '#F08080',
      '#CD5C5C',
      '#DC143C',
      '#B22222',
      '#FF4500',
      '#FF8C00',
      '#FFA500',
      '#FFD700',
      '#FFFF00',
      '#ADFF2F',
      '#7FFF00',
      '#7CFC00',
      '#00FF00',
      '#32CD32',
      '#00FA9A',
      '#00FF7F',
      '#3CB371',
      '#2E8B57',
      '#228B22',
      '#006400',
      '#9ACD32',
      '#6B8E23',
      '#556B2F',
      '#66CDAA',
      '#8FBC8B',
      '#20B2AA',
      '#008B8B',
      '#008080',
      '#00CED1',
      '#40E0D0',
      '#48D1CC',
      '#AFEEEE',
      '#7FFFD4',
      '#B0E0E6',
      '#ADD8E6',
      '#87CEEB',
      '#87CEFA',
      '#4682B4',
      '#4169E1',
      '#0000FF',
      '#0000CD',
      '#00008B',
      '#000080',
      '#191970',
      '#8A2BE2',
      '#9932CC',
      '#9400D3',
      '#800080',
      '#9370DB',
      '#DDA0DD',
      '#EE82EE',
      '#DA70D6',
      '#FF00FF',
      '#BA55D3',
      '#D8BFD8',
      '#E6E6FA',
      '#DCDCDC',
    ];
    const charCode = username.charCodeAt(0);
    const colorIndex = charCode % colors.length;
    return colors[colorIndex];
  }
}
