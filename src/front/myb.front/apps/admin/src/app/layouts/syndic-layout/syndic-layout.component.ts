import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { KeycloakService } from '@myb-front/auth';

@Component({
  selector: 'app-syndic-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './syndic-layout.component.html',
  styleUrls: ['./syndic-layout.component.scss']
})
export class SyndicLayoutComponent implements OnInit {
  private keycloakService = inject(KeycloakService);
  private router = inject(Router);
  
  // State signals
  unpaidInvoices = signal(0);
  urgentRequests = signal(0);
  managedCoproperties = signal(12);
  currentUser = signal({ name: 'Marie Dubois', firstName: 'Marie', lastName: 'Dubois', role: 'Syndic' });
  
  // Sidebar state
  isSidebarCollapsed = signal(false);
  
  ngOnInit(): void {
    // Load dashboard statistics
    this.loadStatistics();
  }
  
  private loadStatistics(): void {
    // TODO: Load from API
    // For now, using mock data
    this.unpaidInvoices.set(5);
    this.urgentRequests.set(3);
  }
  
  toggleSidebar(): void {
    this.isSidebarCollapsed.update(value => !value);
  }
  
  logout(): void {
    this.keycloakService.logout();
  }
}
