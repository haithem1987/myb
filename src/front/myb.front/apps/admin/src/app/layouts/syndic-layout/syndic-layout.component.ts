import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { KeycloakService } from '@myb-front/auth';
import { ToastsContainerComponent, ModalContainerComponent, NotificationDropdownComponent, NotificationService, UserDropdownComponent } from '@myb-front/shared-ui';
import { CopropertyService, CurrencyService, Currency } from '@myb-front/coproperty-module';
import { ChargeService } from '@myb-front/coproperty-module';
import { UnitService } from '@myb-front/coproperty-module';
import { Notification } from 'libs/shared/infra/models/notification.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-syndic-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastsContainerComponent, ModalContainerComponent, NotificationDropdownComponent, UserDropdownComponent],
  templateUrl: './syndic-layout.component.html',
  styleUrls: ['./syndic-layout.component.scss']
})
export class SyndicLayoutComponent implements OnInit {
  private keycloakService = inject(KeycloakService);
  private router = inject(Router);
  private copropertyService = inject(CopropertyService);
  private chargeService = inject(ChargeService);
  private unitService = inject(UnitService);
  private notificationService = inject(NotificationService);
  private currencyService = inject(CurrencyService);
  
  // State signals
  unpaidInvoices = signal(0);
  urgentRequests = signal(0);
  managedCoproperties = signal(0);
  totalBudgets = signal(0);
  totalUnits = signal(0);
  totalOwners = signal(0);
  currentUser = signal<{ name: string; firstName: string; lastName: string; role: string }>({ name: '', firstName: '', lastName: '', role: 'Syndic' });
  
  // Notification state
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  
  // Dual-role flag: syndic who is also a coproprietaire
  isCoproprietaire = signal(false);

  // Sidebar state
  isSidebarCollapsed = signal(true);
  
  ngOnInit(): void {
    this.loadUserFromKeycloak();
    // Load dashboard statistics
    this.loadStatistics();
    // Start real-time notifications
    this.initNotifications();
  }
  
  private async initNotifications(): Promise<void> {
    await this.notificationService.startConnection();
    const userId = this.keycloakService.getProfile()?.id || '';
    if (userId) {
      this.notificationService.getNotificationsByUserId(userId);
    }
    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications.set(notifications);
    });
    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount.set(count);
    });
  }

  onMarkAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId);
  }

  onMarkAllAsRead(): void {
    const userId = this.keycloakService.getProfile()?.id || '';
    if (userId) {
      this.notificationService.markAllAsRead(userId);
    }
  }
  
  private loadUserFromKeycloak(): void {
    try {
      const profile = this.keycloakService.getProfile();
      const keycloak = (this.keycloakService as any).keycloak;
      const token = keycloak?.tokenParsed;

      const firstName = profile?.firstName || token?.given_name || '';
      const lastName = profile?.lastName || token?.family_name || '';
      const name = `${firstName} ${lastName}`.trim() || token?.preferred_username || 'Utilisateur';

      this.currentUser.set({ name, firstName: firstName || 'U', lastName: lastName || '', role: 'Syndic' });
      // Check if this syndic is also a coproprietaire
      const roles = this.keycloakService.getUserRoles();
      this.isCoproprietaire.set(roles.includes('coproperty-owner'));
    } catch (e) {
      console.error('Error loading user from Keycloak', e);
      this.currentUser.set({ name: 'Utilisateur', firstName: 'U', lastName: '', role: 'Syndic' });
    }
  }
  
  private loadStatistics(): void {
    // Load all statistics in parallel using forkJoin
    const managerId = this.keycloakService.getSyndicManagerId();
    forkJoin({
      coproperties: this.copropertyService.getCoproperties(managerId),
      charges: this.chargeService.getAllCharges()
    }).subscribe({
      next: (results) => {
        // Set coproperty count
        this.managedCoproperties.set(results.coproperties.length);

        // Initialize currency from first coproperty
        if (results.coproperties.length > 0 && results.coproperties[0].currency) {
          this.currencyService.setCurrency(results.coproperties[0].currency as Currency);
        }
        
        // Set budgets count
        this.totalBudgets.set(results.charges.length);
        
        // Load units from all coproperties
        if (results.coproperties.length > 0) {
          const unitRequests = results.coproperties.map(coproperty =>
            this.unitService.getUnitsByCoproperty(coproperty.id)
          );
          
          forkJoin(unitRequests).subscribe({
            next: (unitResults) => {
              const allUnits = unitResults.flat();
              this.totalUnits.set(allUnits.length);
            },
            error: (err) => console.error('Error loading units count:', err)
          });
        }
      },
      error: (err) => console.error('Error loading statistics:', err)
    });
    
    // TODO: Load owners count when service is available
  }
  
  toggleSidebar(): void {
    this.isSidebarCollapsed.update(value => !value);
  }

  onNavItemClick(): void {
    // Collapse sidebar on mobile when a nav item is clicked
    if (window.innerWidth < 768) {
      this.isSidebarCollapsed.set(true);
    }
  }

  switchToOwnerSpace(): void {
    this.router.navigate(['/coproperty/owner/dashboard']);
  }
  
  logout(): void {
    this.keycloakService.logout();
  }
}
