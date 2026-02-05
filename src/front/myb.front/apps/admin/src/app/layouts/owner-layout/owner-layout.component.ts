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
  currentUser = signal({ name: 'Jean Martin', firstName: 'Jean', lastName: 'Martin', role: 'Owner' });
  
  // Sidebar state
  isMobileMenuOpen = signal(false);
  
  ngOnInit(): void {
    this.loadOwnerData();
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
