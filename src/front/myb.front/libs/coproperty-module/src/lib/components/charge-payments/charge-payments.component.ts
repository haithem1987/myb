import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ChargeService, ChargeDistributionPayment } from '../../services/charge.service';
import { CopropertyService } from '../../services/coproperty.service';
import { CurrencyService } from '../../services/currency.service';
import { Coproperty } from '../../models/coproperty.models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

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
  private destroyRef = inject(DestroyRef);

  coproperties = signal<Coproperty[]>([]);
  selectedCopropertyId = signal<string>('');
  distributions = signal<ChargeDistributionPayment[]>([]);
  loading = signal(false);
  filterStatus = signal<string>('');
  searchTerm = signal<string>('');

  ngOnInit(): void {
    this.loadCoproperties();
  }

  private loadCoproperties(): void {
    this.copropertyService.getCoproperties()
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

  get filteredDistributions(): ChargeDistributionPayment[] {
    let result = this.distributions();
    const status = this.filterStatus();
    const search = this.searchTerm().toLowerCase();

    if (status) {
      result = result.filter(d => d.paymentStatus === status);
    }
    if (search) {
      result = result.filter(d =>
        (d.chargeName?.toLowerCase().includes(search)) ||
        (d.unitNumber?.toLowerCase().includes(search)) ||
        (d.ownerName?.toLowerCase().includes(search)) ||
        (d.paymentTransactionId?.toLowerCase().includes(search))
      );
    }
    return result;
  }

  get totalAmount(): number {
    return this.filteredDistributions.reduce((sum, d) => sum + d.amount, 0);
  }

  get totalPaid(): number {
    return this.filteredDistributions.reduce((sum, d) => sum + (d.paidAmount || 0), 0);
  }

  get totalRemaining(): number {
    return this.totalAmount - this.totalPaid;
  }

  get paidCount(): number {
    return this.filteredDistributions.filter(d => d.paymentStatus === 'PAID').length;
  }

  get unpaidCount(): number {
    return this.filteredDistributions.filter(d => d.paymentStatus === 'UNPAID' || !d.paymentStatus).length;
  }

  get collectionRate(): number {
    return this.totalAmount > 0 ? (this.totalPaid / this.totalAmount) * 100 : 0;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PAID': return 'bg-success';
      case 'PARTIALLY_PAID': return 'bg-warning text-dark';
      case 'PENDING': return 'bg-info';
      case 'FAILED': return 'bg-danger';
      case 'UNPAID': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PAID': return 'Payé';
      case 'PARTIALLY_PAID': return 'Partiel';
      case 'PENDING': return 'En attente';
      case 'FAILED': return 'Échoué';
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
