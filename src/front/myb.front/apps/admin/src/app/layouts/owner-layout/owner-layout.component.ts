import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { KeycloakService } from '@myb-front/auth';
import { ToastsContainerComponent, ModalContainerComponent } from '@myb-front/shared-ui';

@Component({
  selector: 'app-owner-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastsContainerComponent, ModalContainerComponent],
  templateUrl: './owner-layout.component.html',
  styleUrls: ['./owner-layout.component.scss']
})
export class OwnerLayoutComponent implements OnInit {
  private keycloakService = inject(KeycloakService);
  
  // State signals
  pendingInvoices = signal(2);
  activeRequests = signal(1);
  currentUser = signal<{ name: string; firstName: string; lastName: string; role: string }>({ name: 'Utilisateur', firstName: 'U', lastName: ' ', role: 'Copropriétaire' });
  
  // Sidebar state
  isMobileMenuOpen = signal(false);
  
  ngOnInit(): void {
    this.loadUserFromKeycloak();
    this.loadOwnerData();
  }
  
  private loadUserFromKeycloak(): void {
    try {
      const profile = this.keycloakService.getProfile();
      const keycloak = (this.keycloakService as any).keycloak;
      const token = keycloak?.tokenParsed;

      const firstName = profile?.firstName || token?.given_name || '';
      const lastName = profile?.lastName || token?.family_name || '';
      const name = `${firstName} ${lastName}`.trim() || token?.preferred_username || 'Utilisateur';

      this.currentUser.set({ name, firstName: firstName || 'U', lastName: lastName || '', role: 'Copropriétaire' });
    } catch (e) {
      console.error('Error loading user from Keycloak', e);
      this.currentUser.set({ name: 'Utilisateur', firstName: 'U', lastName: ' ', role: 'Copropriétaire' });
    }
  }
  
  private loadOwnerData(): void {
    // TODO: Load from API
    this.pendingInvoices.set(2);
    this.activeRequests.set(1);
  }
  
  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);
  }
  
  logout(): void {
    this.keycloakService.logout();
  }
}
