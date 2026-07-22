import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ChargeService, ChargeDistributionPayment } from '../../services/charge.service';
import { CopropertyService } from '../../services/coproperty.service';
import { CurrencyService } from '../../services/currency.service';
import { Coproperty } from '../../models/coproperty.models';
import { KeycloakService } from '@myb-front/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { ToastService } from 'libs/shared/infra/services/toast.service';

/** A charge (budget) aggregated from its distributions for the syndic supplier payment view */
export interface ChargePaymentSummary {
  chargeId: string;
  chargeName: string;
  chargeDescription: string;
  chargeType: string;
  chargeFrequency: string;
  currency: string;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
  paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
  paidAt: string | null;
  paymentMethod: string | null;
  paymentTransactionId: string | null;
  /** The underlying distribution IDs for this charge */
  distributionIds: string[];
}

@Component({
  selector: 'myb-charge-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './charge-payments.component.html',
  styleUrls: ['./charge-payments.component.scss'],
})
export class ChargePaymentsComponent implements OnInit {
  private chargeService = inject(ChargeService);
  private copropertyService = inject(CopropertyService);
  private currencyService = inject(CurrencyService);
  private keycloakService = inject(KeycloakService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  coproperties = signal<Coproperty[]>([]);
  selectedCopropertyId = signal<string>('');
  distributions = signal<ChargeDistributionPayment[]>([]);
  loading = signal(false);
  paying = signal<string | null>(null);
  filterStatus = signal<string>('');
  searchTerm = signal<string>('');

  // Payment modal state
  showPaymentModal = signal(false);
  selectedCharge = signal<ChargePaymentSummary | null>(null);
  paymentForm = {
    amount: 0,
    paymentMethod: 'Virement',
    transactionId: '',
  };

  ngOnInit(): void {
    this.loadCoproperties();
  }

  private loadCoproperties(): void {
    const managerId = this.keycloakService.getSyndicManagerId();
    this.copropertyService.getCoproperties(managerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.coproperties.set(data);
          if (data.length > 0) {
            this.selectedCopropertyId.set(data[0].id);
            this.loadDistributions(data[0].id);
          }
        },
        error: (err) => console.error('Error loading coproperties:', err),
      });
  }

  onCopropertyChange(copropertyId: string): void {
    this.selectedCopropertyId.set(copropertyId);
    if (copropertyId) {
      this.loadDistributions(copropertyId);
    } else {
      this.distributions.set([]);
    }
  }

  loadDistributions(copropertyId: string): void {
    this.loading.set(true);
    this.chargeService.getCopropertyChargeDistributions(copropertyId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (data) => this.distributions.set(data),
        error: (err) => {
          console.error('Error loading distributions:', err);
          this.distributions.set([]);
        },
      });
  }

  /** Aggregate distributions by chargeId into ChargePaymentSummary */
  get chargeSummaries(): ChargePaymentSummary[] {
    const grouped = new Map<string, ChargeDistributionPayment[]>();
    for (const d of this.distributions()) {
      const list = grouped.get(d.chargeId) || [];
      list.push(d);
      grouped.set(d.chargeId, list);
    }

    const summaries: ChargePaymentSummary[] = [];
    for (const [chargeId, dists] of grouped) {
      const first = dists[0];
      const totalAmount = dists.reduce((sum, d) => sum + d.amount, 0);
      const paidAmount = dists.reduce((sum, d) => sum + (d.paidAmount || 0), 0);
      const remaining = totalAmount - paidAmount;

      let paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
      if (paidAmount >= totalAmount) paymentStatus = 'PAID';
      else if (paidAmount > 0) paymentStatus = 'PARTIALLY_PAID';
      else paymentStatus = 'UNPAID';

      // Use the latest payment info from individual distributions
      const paidDist = dists.find(d => d.paidAt);

      summaries.push({
        chargeId,
        chargeName: first.chargeName,
        chargeDescription: first.chargeDescription,
        chargeType: first.chargeType,
        chargeFrequency: first.chargeFrequency,
        currency: first.currency,
        totalAmount,
        paidAmount,
        remaining,
        paymentStatus,
        paidAt: paidDist?.paidAt || null,
        paymentMethod: paidDist?.paymentMethod || null,
        paymentTransactionId: paidDist?.paymentTransactionId || null,
        distributionIds: dists.map(d => d.id),
      });
    }
    return summaries;
  }

  get filteredSummaries(): ChargePaymentSummary[] {
    let result = this.chargeSummaries;
    const status = this.filterStatus();
    const search = this.searchTerm().toLowerCase();

    if (status) {
      result = result.filter(s => s.paymentStatus === status);
    }
    if (search) {
      result = result.filter(s =>
        s.chargeName?.toLowerCase().includes(search) ||
        s.chargeType?.toLowerCase().includes(search) ||
        s.paymentTransactionId?.toLowerCase().includes(search)
      );
    }
    return result;
  }

  get totalAmount(): number {
    return this.filteredSummaries.reduce((sum, s) => sum + s.totalAmount, 0);
  }

  get totalPaid(): number {
    return this.filteredSummaries.reduce((sum, s) => sum + s.paidAmount, 0);
  }

  get totalRemaining(): number {
    return this.totalAmount - this.totalPaid;
  }

  get paidCount(): number {
    return this.filteredSummaries.filter(s => s.paymentStatus === 'PAID').length;
  }

  get unpaidCount(): number {
    return this.filteredSummaries.filter(s => s.paymentStatus === 'UNPAID').length;
  }

  get collectionRate(): number {
    return this.totalAmount > 0 ? (this.totalPaid / this.totalAmount) * 100 : 0;
  }

  // ─── Payment Modal ──────────────────────────────────────────
  openPaymentModal(summary: ChargePaymentSummary): void {
    this.selectedCharge.set(summary);
    this.paymentForm.amount = summary.remaining;
    this.paymentForm.paymentMethod = 'Virement';
    this.paymentForm.transactionId = '';
    this.showPaymentModal.set(true);
  }

  closePaymentModal(): void {
    this.showPaymentModal.set(false);
    this.selectedCharge.set(null);
  }

  confirmPayment(): void {
    const charge = this.selectedCharge();
    if (!charge || this.paymentForm.amount <= 0) return;

    this.paying.set(charge.chargeId);

    // Distribute the payment amount proportionally across all distributions of this charge
    const amountPerDistribution = this.paymentForm.amount / charge.distributionIds.length;
    const transactionId = this.paymentForm.transactionId || `SYNDIC-${Date.now()}`;

    const paymentRequests = charge.distributionIds.map(distId =>
      this.chargeService.markChargeDistributionPaid(
        distId,
        transactionId,
        this.paymentForm.paymentMethod,
        amountPerDistribution
      ).pipe(catchError(() => of(null)))
    );

    forkJoin(paymentRequests)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          const successCount = results.filter(r => r !== null).length;
          if (successCount > 0) {
            this.toastService.show(
              `Paiement fournisseur enregistré pour "${charge.chargeName}"`,
              { classname: 'bg-success text-white', delay: 4000 }
            );
          }
          this.paying.set(null);
          this.closePaymentModal();
          this.refreshData();
        },
        error: () => {
          this.toastService.show(
            'Erreur lors de l\'enregistrement du paiement',
            { classname: 'bg-danger text-white', delay: 4000 }
          );
          this.paying.set(null);
        },
      });
  }

  // ─── Helpers ─────────────────────────────────────────────────
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PAID': return 'bg-success';
      case 'PARTIALLY_PAID': return 'bg-warning text-dark';
      case 'UNPAID': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PAID': return 'Payé';
      case 'PARTIALLY_PAID': return 'Partiel';
      case 'UNPAID': return 'Non payé';
      default: return 'Non payé';
    }
  }

  getChargeTypeIcon(type: string): string {
    switch (type?.toUpperCase()) {
      case 'CLEANING': return 'bi-brush';
      case 'SECURITY': return 'bi-shield-check';
      case 'MAINTENANCE': return 'bi-tools';
      case 'ELECTRICITY': return 'bi-lightning-charge';
      case 'WATER': return 'bi-droplet';
      case 'INSURANCE': return 'bi-shield';
      default: return 'bi-cash-stack';
    }
  }

  getChargeTypeLabel(type: string): string {
    switch (type?.toUpperCase()) {
      case 'CLEANING': return 'Nettoyage';
      case 'SECURITY': return 'Sécurité';
      case 'MAINTENANCE': return 'Entretien';
      case 'ELECTRICITY': return 'Électricité';
      case 'WATER': return 'Eau';
      case 'INSURANCE': return 'Assurance';
      default: return 'Autre';
    }
  }

  formatAmount(amount: number): string {
    return this.currencyService.formatAmount(amount);
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onStatusFilterChange(event: Event): void {
    this.filterStatus.set((event.target as HTMLSelectElement).value);
  }

  refreshData(): void {
    const id = this.selectedCopropertyId();
    if (id) this.loadDistributions(id);
  }
}
