import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { KeycloakService } from '@myb-front/auth';
import { ToastsContainerComponent, ModalContainerComponent, NotificationDropdownComponent, NotificationService, UserDropdownComponent } from '@myb-front/shared-ui';
import {
  ChargeService,
  CopropertyService,
  Currency,
  CurrencyService,
  FundCallService,
  InterventionService,
  OwnerService,
  SignalementService,
  TenantService,
  UnitService,
} from '@myb-front/coproperty-module';
import { Notification } from 'libs/shared/infra/models/notification.model';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { ActiveCopropertyService } from '../../services/active-coproperty.service';
import { Observable } from 'rxjs';

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
  private ownerService = inject(OwnerService);
  private tenantService = inject(TenantService);
  private fundCallService = inject(FundCallService);
  private interventionService = inject(InterventionService);
  private signalementService = inject(SignalementService);
  private notificationService = inject(NotificationService);
  private currencyService = inject(CurrencyService);
  private destroyRef = inject(DestroyRef);
  private activeCoproperty = inject(ActiveCopropertyService);
  private statisticsRequestId = 0;
  
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
  activeCopropertyName = signal(this.activeCoproperty.activeCoproperty()?.name ?? '');

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
      this.notificationService.getNotificationsByUserId(userId, this.activeCoproperty.activeId());
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
      this.notificationService.markAllAsRead(userId, this.activeCoproperty.activeId());
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
    const requestId = ++this.statisticsRequestId;

    this.copropertyService.getCoproperties(managerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (coproperties) => {
        if (requestId !== this.statisticsRequestId) return;

        this.managedCoproperties.set(coproperties.length);
        const selectedId = this.activeCoproperty.selectAvailable(coproperties);
        const selected = coproperties.find(coproperty => coproperty.id === selectedId);
        if (selected?.name) {
          this.activeCopropertyName.set(selected.name);
        }
        if (selected?.currency) {
          this.currencyService.setCurrency(selected.currency as Currency);
        }

        if (!selectedId) return;

        const userId = this.keycloakService.getProfile()?.id || '';
        if (userId) {
          this.notificationService.getNotificationsByUserId(userId, selectedId);
        }

        this.loadScopedCount('budgets', this.chargeService.getChargesByCoproperty(selectedId), selectedId, requestId, items => this.totalBudgets.set(items.length));
        this.loadScopedCount('units', this.unitService.getUnitsByCoproperty(selectedId), selectedId, requestId, items => this.totalUnits.set(items.length));
        this.loadScopedCount('owners', this.ownerService.getAllOwners(selectedId), selectedId, requestId, items => this.totalOwners.set(items.length));
        this.loadScopedCount('tenants', this.tenantService.getTenants(selectedId), selectedId, requestId, items => this.totalTenants.set(items.length));
        this.loadScopedCount('fund calls', this.fundCallService.getFundCallsByCoproperty(selectedId), selectedId, requestId, items => this.totalFundCalls.set(items.length));
        this.loadScopedCount(
          'charge payments',
          this.chargeService.getCopropertyChargeDistributions(selectedId),
          selectedId,
          requestId,
          items => this.totalChargePayments.set(new Set(items.map(item => item.chargeId)).size)
        );
        this.loadScopedCount('interventions', this.interventionService.getInterventionsByCoproperty(selectedId), selectedId, requestId, items => this.totalInterventions.set(items.length));
        this.loadScopedCount('signalements', this.signalementService.getSignalements(selectedId), selectedId, requestId, items => this.totalSignalements.set(items.length));
      },
      error: (err) => {
        if (requestId !== this.statisticsRequestId) return;
        console.error('Error loading sidebar coproperties:', err);
      }
    });
  }

  private loadScopedCount<T>(
    label: string,
    request: Observable<T[]>,
    copropertyId: string,
    requestId: number,
    apply: (items: T[]) => void
  ): void {
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: items => {
        if (
          requestId === this.statisticsRequestId &&
          this.activeCoproperty.activeId() === copropertyId
        ) {
          apply(items);
        }
      },
      error: error => console.error(`Error loading sidebar ${label}:`, error)
    });
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
    this.router.navigate(['/coproperty/select'], { queryParams: { space: 'owner' } });
  }

  changeCoproperty(): void {
    this.router.navigate(['/coproperty/select'], { queryParams: { space: 'syndic', manage: 'true' } });
  }
  
  logout(): void {
    this.keycloakService.logout();
  }
}
