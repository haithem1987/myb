import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OwnerService, Unit, CopropertyInvoice, InvoiceStatus, CopropertyService, Coproperty, ChargeDistribution, CurrencyService } from '@myb-front/coproperty-module';
import { KeycloakService } from '@myb-front/auth';
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
  private keycloakService = inject(KeycloakService);
  private currencyService = inject(CurrencyService);

  myUnits = signal<OwnerUnit[]>([]);
  pendingInvoices = signal<PendingInvoice[]>([]);
  recentInvoices = signal<RecentInvoice[]>([]);
  totalDue = signal(0);
  totalPaid = signal(0);
  overdueCount = signal(0);
  totalCharges = signal(0);
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
          invoices: this.ownerService.getMyInvoices(userId).pipe(take(1), catchError(() => of([] as CopropertyInvoice[]))),
          coproperties: this.copropertyService.getCoproperties().pipe(take(1), catchError(() => of([] as Coproperty[]))),
          distributions: ownerId
            ? this.ownerService.getOwnerChargeDistributions(ownerId).pipe(take(1), catchError(() => of([] as ChargeDistribution[])))
            : of([] as ChargeDistribution[]),
        });
      })
    ).subscribe({
      next: ({ units, invoices, coproperties, distributions }) => {
        const copropertyMap = new Map<string, string>(
          coproperties.map((c) => [c.id, c.name])
        );

        // Map units
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

        // Map invoices - filter pending/overdue
        const pending = invoices.filter(inv =>
          inv.status === InvoiceStatus.PENDING ||
          inv.status === InvoiceStatus.OVERDUE ||
          inv.status === InvoiceStatus.PARTIALLY_PAID
        );
        const overdue = invoices.filter(inv => inv.status === InvoiceStatus.OVERDUE);
        this.overdueCount.set(overdue.length);

        this.pendingInvoices.set(pending.map(inv => ({
          id: inv.id,
          number: inv.invoiceNumber,
          date: new Date(inv.invoiceDate),
          amount: inv.totalAmount,
          dueDate: new Date(inv.dueDate),
          description: inv.notes || `Facture ${inv.invoiceNumber}`,
        })));

        // Paid invoices total
        const paid = invoices.filter(inv => inv.status === InvoiceStatus.PAID);
        this.totalPaid.set(paid.reduce((sum, inv) => sum + inv.totalAmount, 0));

        // Map all invoices (latest 5) for the recent invoices list
        const sorted = [...invoices].sort((a, b) =>
          new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
        ).slice(0, 5);
        this.recentInvoices.set(sorted.map(inv => ({
          id: inv.id,
          number: inv.invoiceNumber,
          description: inv.description || inv.notes || `Facture ${inv.invoiceNumber}`,
          date: new Date(inv.invoiceDate),
          amount: inv.totalAmount,
          status: inv.status === InvoiceStatus.PAID ? 'paid' : inv.status === InvoiceStatus.OVERDUE ? 'overdue' : 'pending',
          paymentMethod: inv.paymentMethod ?? '',
        })));

        // Total charges from distributions
        this.totalCharges.set(distributions.reduce((sum, d) => sum + d.amount, 0));

        // Calculate total due from charge distributions (unpaid)
        const chargeDue = distributions
          .filter(d => d.paymentStatus !== 'PAID' && d.paymentStatus !== 'Paid')
          .reduce((sum, d) => sum + d.amount - (d.paidAmount || 0), 0);

        const invoiceDue = pending.reduce((sum, inv) => sum + inv.totalAmount, 0);

        this.totalDue.set(Math.max(chargeDue, invoiceDue));

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
