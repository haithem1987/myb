import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OwnerService } from '../../services/owner.service';
import { CopropertyService } from '../../services/coproperty.service';
import { CurrencyService } from '../../services/currency.service';
import { FundCallService, FundCallExtended } from '../../services/fund-call.service';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { Unit, Coproperty } from '../../models';
import { FundCallPaymentWithContext } from '../../models/fund-call.model';
import { forkJoin, of } from 'rxjs';
import { catchError, take, switchMap } from 'rxjs/operators';

interface OwnerUnit {
  id: string;
  buildingName: string;
  unitNumber: string;
  type: string;
  surface: number;
  shares: number;
}

interface PendingInvoice {
  id: string;
  number: string;
  date: Date;
  amount: number;
  dueDate: Date;
  description: string;
}

interface RecentInvoice {
  id: string;
  number: string;
  description: string;
  date: Date;
  amount: number;
  status: string;
  paymentMethod: string;
}

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './owner-dashboard.component.html',
  styleUrls: ['./owner-dashboard.component.scss']
})
export class OwnerDashboardComponent implements OnInit {
  private ownerService = inject(OwnerService);
  private copropertyService = inject(CopropertyService);
  private fundCallService = inject(FundCallService);
  private keycloakService = inject(KeycloakService);
  private currencyService = inject(CurrencyService);

  myUnits = signal<OwnerUnit[]>([]);
  pendingInvoices = signal<PendingInvoice[]>([]);
  recentInvoices = signal<RecentInvoice[]>([]);
  totalDue = signal(0);
  totalPaid = signal(0);
  overdueCount = signal(0);
  totalCharges = signal(0);
  cancelledFundCallsCount = signal(0);
  loading = signal(true);

  totalShares = computed(() => this.myUnits().reduce((sum, u) => sum + u.shares, 0));
  totalSurface = computed(() => this.myUnits().reduce((sum, u) => sum + u.surface, 0));

  ngOnInit(): void {
    this.loadOwnerData();
  }

  formatAmount(amount: number): string {
    return this.currencyService.formatAmount(amount);
  }

  private getCurrentUserId(): string | null {
    const token = this.keycloakService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  private loadOwnerData(): void {
    const userId = this.getCurrentUserId();
    if (!userId) {
      console.error('[OwnerDashboard] User ID not available');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    this.ownerService.getOwnerByUserId(userId).pipe(
      take(1),
      catchError(() => of(null)),
      switchMap((owner) => {
        const ownerId = owner?.id;
        return forkJoin({
          units: this.ownerService.getMyUnits(userId).pipe(take(1), catchError(() => of([] as Unit[]))),
          coproperties: this.copropertyService.getCoproperties().pipe(take(1), catchError(() => of([] as Coproperty[]))),
          // Appels de fonds créés par le syndic pour ce propriétaire
          fundCalls: ownerId
            ? this.fundCallService.getFundCallsByOwner(ownerId).pipe(take(1), catchError(() => of([] as FundCallExtended[])))
            : of([] as FundCallExtended[]),
          // Paiements effectués par le propriétaire (= reçus)
          payments: this.fundCallService.getFundCallPaymentsByOwner(userId).pipe(take(1), catchError(() => of([] as FundCallPaymentWithContext[]))),
        });
      })
    ).subscribe({
      next: ({ units, coproperties, fundCalls, payments }) => {
        const copropertyMap = new Map<string, string>(
          coproperties.map((c) => [c.id, c.name])
        );

        this.myUnits.set(units.map(u => {
          const typeLower = (u.unitType ?? '').toLowerCase();
          let type = 'Autre';
          if (typeLower.includes('apart') || typeLower.includes('appartement')) type = 'Appartement';
          else if (typeLower.includes('parking') || typeLower === 'garage') type = 'Parking';
          else if (typeLower.includes('cave') || typeLower.includes('cellar')) type = 'Cave';

          return {
            id: u.id,
            buildingName: copropertyMap.get(u.copropertyId) ?? 'Copropriété',
            unitNumber: u.unitNumber,
            type,
            surface: u.area ?? 0,
            shares: u.shares,
          };
        }));

        // Appels de fonds À PAYER = statut TO_PAY
        const toPayFundCalls = fundCalls.filter(fc => fc.status === 'TO_PAY');
        const overdueFundCalls = toPayFundCalls.filter(fc => new Date() > new Date(fc.dueDate));
        this.overdueCount.set(overdueFundCalls.length);
        this.cancelledFundCallsCount.set(fundCalls.filter(fc => fc.status === 'CANCELLED').length);

        this.pendingInvoices.set(toPayFundCalls.map(fc => ({
          id: fc.id,
          number: fc.id.substring(0, 8).toUpperCase(),
          date: new Date(fc.createdAt),
          amount: fc.amount,
          dueDate: new Date(fc.dueDate),
          description: fc.description || 'Appel de fonds',
        })));

        // Total dû = somme des appels de fonds TO_PAY
        this.totalDue.set(toPayFundCalls.reduce((sum, fc) => sum + fc.amount, 0));

        // Total charges = tous les appels de fonds du propriétaire
        this.totalCharges.set(fundCalls.reduce((sum, fc) => sum + fc.amount, 0));

        // Total payé = paiements approuvés
        const approvedPayments = payments.filter(p => p.validationStatus === 'Approved');
        this.totalPaid.set(approvedPayments.reduce((sum, p) => sum + p.amount, 0));

        // Derniers reçus (5 max, triés par date de paiement)
        const recentReceipts: RecentInvoice[] = payments
          .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
          .slice(0, 5)
          .map(p => ({
            id: p.id,
            number: `FC-${p.id.slice(0, 8).toUpperCase()}`,
            description: p.fundCall?.description
              ? `Appel de fonds : ${p.fundCall.description}`
              : 'Appel de fonds',
            date: new Date(p.paymentDate),
            amount: p.amount,
            status: p.validationStatus === 'Approved' ? 'paid' : 'pending',
            paymentMethod: p.paymentMethod ?? '',
          }));
        this.recentInvoices.set(recentReceipts);

        this.loading.set(false);
      },
      error: (err) => {
        console.error('[OwnerDashboard] Error loading data:', err);
        this.loading.set(false);
      },
    });
  }

  isOverdue(dueDate: Date): boolean {
    return new Date() > new Date(dueDate);
  }

  getDaysUntilDue(dueDate: Date): number {
    const now = new Date();
    const diff = new Date(dueDate).getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'paid': return 'Payée';
      case 'overdue': return 'En retard';
      case 'pending': return 'En attente';
      default: return status;
    }
  }
}
