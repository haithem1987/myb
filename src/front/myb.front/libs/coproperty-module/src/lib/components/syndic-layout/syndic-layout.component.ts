import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { KeycloakService } from '@myb-front/auth';
import { ToastsContainerComponent, ModalContainerComponent, NotificationDropdownComponent, NotificationService, UserDropdownComponent } from '@myb-front/shared-ui';
import { CopropertyService, CurrencyService, Currency } from '@myb-front/coproperty-module';
import { ChargeService } from '@myb-front/coproperty-module';
import { UnitService } from '@myb-front/coproperty-module';
import { Notification } from 'libs/shared/infra/models/notification.model';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

@Component({
  selector: 'myb-coproperty-syndic-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, ToastsContainerComponent, ModalContainerComponent, NotificationDropdownComponent, UserDropdownComponent],
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
  private destroyRef = inject(DestroyRef);
  
  // State signals
  unpaidInvoices = signal(0);
  urgentRequests = signal(0);
  managedCoproperties = signal(0);
  totalBudgets = signal(0);
  totalUnits = signal(0);
  totalOwners = signal(0);
  totalTenants = signal(0);
  totalFundCalls = signal(0);
  totalChargePayments = signal(0);
  totalInterventions = signal(0);
  totalSignalements = signal(0);
  totalDiscussions = signal(0);
  currentUser = signal<{ name: string; firstName: string; lastName: string; role: string }>({ name: '', firstName: '', lastName: '', role: 'Syndic' });
  
  // Notification state
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  
  // Dual-role flag: syndic who is also a coproprietaire
  isCoproprietaire = signal(false);

  // Sidebar state: expanded by default on desktop (>992px), collapsed on mobile/tablet
  isSidebarCollapsed = signal(window.innerWidth <= 992);
  
  ngOnInit(): void {
    this.loadUserFromKeycloak();
    // Load dashboard statistics
    this.loadStatistics();
    this.chargeService.budgetChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadStatistics());
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
    const managerId = this.keycloakService.getSyndicManagerId();

    // Keep the already-supported counts independent from the aggregate query.
    // This matters during rolling/local upgrades where the frontend can start
    // before the backend has exposed `syndicMenuCounts`.
    this.copropertyService.getCoproperties(managerId).subscribe({
      next: (coproperties) => {
        this.managedCoproperties.set(coproperties.length);
        if (coproperties.length > 0 && coproperties[0].currency) {
          this.currencyService.setCurrency(coproperties[0].currency as Currency);
        }
      },
      error: (err) => console.error('Error loading sidebar coproperties:', err)
    });

    this.copropertyService.getSyndicMenuCounts().subscribe({
      next: (counts) => {
        this.managedCoproperties.set(counts.coproperties);
        this.totalBudgets.set(counts.budgets);
        this.totalUnits.set(counts.units);
        this.totalOwners.set(counts.owners);
        this.totalTenants.set(counts.tenants);
        this.totalFundCalls.set(counts.fundCalls);
        this.totalChargePayments.set(counts.chargePayments);
        this.totalInterventions.set(counts.interventions);
        this.totalSignalements.set(counts.signalements);
        this.totalDiscussions.set(counts.discussions);
      },
      error: (err) => {
        console.warn('Aggregate sidebar counts unavailable; using compatible fallbacks.', err);
        this.loadCompatibleCountFallbacks(managerId);
      }
    });
  }

  /** Counts supported by older coproperty backends during a rolling upgrade. */
  private loadCompatibleCountFallbacks(managerId?: string): void {
    this.chargeService.getAllCharges().subscribe({
      next: (charges) => {
        this.totalBudgets.set(charges.length);
        // The charge-payment page aggregates the same budget lines. The new
        // aggregate endpoint refines this to distributed lines only.
        this.totalChargePayments.set(charges.length);
      },
      error: (err) => console.error('Error loading fallback budget count:', err)
    });

    this.unitService.getAllUnitsBySyndic(managerId).subscribe({
      next: (units) => this.totalUnits.set(units.length),
      error: (err) => console.error('Error loading fallback unit count:', err)
    });
  }
  
  toggleSidebar(): void {
    this.isSidebarCollapsed.update(value => !value);
  }

  onNavItemClick(): void {
    // Refresh after create/update/delete operations performed on the current page.
    this.loadStatistics();
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
