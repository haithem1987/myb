import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { KeycloakService } from '@myb-front/auth';
import { OwnerService, InvoiceStatus, CopropertyService, CurrencyService, Currency } from '../../../index';
import { ToastsContainerComponent, ModalContainerComponent, NotificationService, UserDropdownComponent } from '@myb-front/shared-ui';
import { take, catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { ActiveCopropertyService } from '../../../services/active-coproperty.service';

@Component({
  selector: 'app-owner-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, ToastsContainerComponent, ModalContainerComponent, UserDropdownComponent],
  templateUrl: './owner-layout.component.html',
  styleUrls: ['./owner-layout.component.scss']
})
export class OwnerLayoutComponent implements OnInit {
  private keycloakService = inject(KeycloakService);
  private ownerService = inject(OwnerService);
  private copropertyService = inject(CopropertyService);
  private currencyService = inject(CurrencyService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private destroyRef = inject(DestroyRef);
  private activeCoproperty = inject(ActiveCopropertyService);
  
  // State signals
  pendingInvoices = signal(0);
  currentUser = signal<{ name: string; firstName: string; lastName: string; role: string }>({ name: 'Utilisateur', firstName: 'U', lastName: ' ', role: 'Copropriétaire' });

  // Dual-role flag: coproprietaire who is also syndic
  isSyndic = signal(false);
  activeCopropertyName = signal('');
  canChangeCoproperty = signal(false);
  
  // Sidebar state
  isMobileMenuOpen = signal(false);
  
  ngOnInit(): void {
    this.loadUserFromKeycloak();
    this.loadOwnerData();
    this.initCurrency();
    this.initRealtimeUpdates();
  }

  private async initRealtimeUpdates(): Promise<void> {
    this.notificationService.dataChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadOwnerData());
    await this.notificationService.startConnection();
  }

  private initCurrency(): void {
    const userId = this.keycloakService.getUserId();
    if (!userId) return;

    forkJoin({
      coproperties: this.copropertyService.getCoproperties().pipe(take(1), catchError(() => of([]))),
      units: this.ownerService.getMyUnits(userId).pipe(take(1), catchError(() => of([])))
    }).subscribe(({ coproperties, units }) => {
      const accessibleIds = new Set(units.map(unit => unit.copropertyId));
      const accessibleCoproperties = coproperties.filter(coproperty => accessibleIds.has(coproperty.id));
      const selectedId = this.activeCoproperty.selectAvailable(accessibleCoproperties);
      const selected = accessibleCoproperties.find(coproperty => coproperty.id === selectedId);
      this.activeCopropertyName.set(selected?.name ?? '');
      this.canChangeCoproperty.set(accessibleCoproperties.length > 1);
      if (selected?.currency) {
        this.currencyService.setCurrency(selected.currency as Currency);
      }
    });
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
      // Check if this coproprietaire is also a syndic
      const roles = this.keycloakService.getUserRoles();
      this.isSyndic.set(roles.includes('coproperty-syndic') || roles.includes('coproperty-admin') || roles.includes('system-admin'));
    } catch (e) {
      console.error('Error loading user from Keycloak', e);
      this.currentUser.set({ name: 'Utilisateur', firstName: 'U', lastName: ' ', role: 'Copropriétaire' });
    }
  }
  
  private loadOwnerData(): void {
    const token = this.keycloakService.getToken();
    if (!token) return;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub;
      if (!userId) return;

      // Load pending invoices count
      this.ownerService.getMyInvoices(userId).pipe(
        take(1),
        catchError(() => of([]))
      ).subscribe(invoices => {
        const pending = invoices.filter(inv =>
          inv.status === InvoiceStatus.PENDING ||
          inv.status === InvoiceStatus.OVERDUE ||
          inv.status === InvoiceStatus.PARTIALLY_PAID
        );
        this.pendingInvoices.set(pending.length);
      });
    } catch {
      // Silently fail - badges will show 0
    }
  }
  
  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);
  }

  switchToSyndicSpace(): void {
    // Navigate to the admin app (deployed at /admin/) which contains syndic routes
    window.location.href = '/admin/coproperty/select?space=syndic';
  }

  changeCoproperty(): void {
    this.router.navigate(['/coproperty/select'], { queryParams: { space: 'owner' } });
  }
  
  logout(): void {
    this.keycloakService.logout();
  }
}
