import { Component, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { ToastService } from 'libs/shared/infra/services/toast.service';

export type ReconciliationStatus = 'AutoMatched' | 'ManualSuggestion' | 'Unmatched';

export interface BankTransaction {
  id: string;
  date: string;
  amount: number;
  label: string;
  reference?: string;
}

export interface MatchedPayment {
  id: number;
  userId: string;
  price: number;
  paymentDate: string;
  serviceName: string;
  paymentStatus: string;
}

export interface ReconciliationItem {
  id: string;
  status: ReconciliationStatus;
  note?: string;
  isManuallyValidated: boolean;
  matchedPayment?: MatchedPayment;
}

export interface ReconciliationRow {
  transaction: BankTransaction;
  reconciliation?: ReconciliationItem;
}

export interface ImportSummary {
  statementId: string;
  fileName: string;
  transactionCount: number;
  autoMatched: number;
  manualSuggestions: number;
  unmatched: number;
}

@Component({
  selector: 'myb-bank-reconciliation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bank-reconciliation.component.html',
  styleUrls: ['./bank-reconciliation.component.scss'],
})
export class BankReconciliationComponent {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly isUploading = signal(false);
  readonly isLoading = signal(false);
  readonly importSummary = signal<ImportSummary | null>(null);
  readonly rows = signal<ReconciliationRow[]>([]);
  readonly filterStatus = signal<ReconciliationStatus | 'all'>('all');

  get filteredRows(): ReconciliationRow[] {
    const filter = this.filterStatus();
    if (filter === 'all') return this.rows();
    return this.rows().filter(r => r.reconciliation?.status === filter);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append('file', file, file.name);

    this.isUploading.set(true);
    this.http.post<ImportSummary>('/api/bank-statements/import', form)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isUploading.set(false))
      )
      .subscribe({
        next: summary => {
          this.importSummary.set(summary);
          this.toastService.show(
            `Importé : ${summary.transactionCount} transactions — ${summary.autoMatched} rapprochées automatiquement`,
            { classname: 'bg-success text-white' }
          );
          this.loadReconciliation(summary.statementId);
        },
        error: err => {
          this.toastService.show(err?.error ?? 'Erreur lors de l\'import', { classname: 'bg-danger text-white' });
        }
      });

    input.value = '';
  }

  private loadReconciliation(statementId: string): void {
    this.isLoading.set(true);
    this.http.get<{ id: string; fileName: string; items: ReconciliationRow[] }>(
      `/api/bank-statements/${statementId}/reconciliation`
    )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: data => this.rows.set(data.items),
        error: () => this.toastService.show('Impossible de charger les détails du rapprochement', { classname: 'bg-danger text-white' })
      });
  }

  validate(row: ReconciliationRow): void {
    if (!this.importSummary() || !row.reconciliation) return;
    const statementId = this.importSummary()!.statementId;

    this.http.post(
      `/api/bank-statements/${statementId}/reconciliation/${row.reconciliation.id}/validate`,
      { matchedPaymentId: row.reconciliation.matchedPayment?.id ?? null }
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.rows.update(rows =>
            rows.map(r =>
              r.reconciliation?.id === row.reconciliation?.id
                ? { ...r, reconciliation: { ...r.reconciliation!, isManuallyValidated: true, status: 'AutoMatched' } }
                : r
            )
          );
          this.toastService.show('Rapprochement validé', { classname: 'bg-success text-white' });
        },
        error: () => this.toastService.show('Erreur lors de la validation', { classname: 'bg-danger text-white' })
      });
  }

  statusLabel(status?: ReconciliationStatus): string {
    switch (status) {
      case 'AutoMatched': return 'Rapproché';
      case 'ManualSuggestion': return 'Suggestion manuelle';
      case 'Unmatched': return 'Non rapproché';
      default: return '—';
    }
  }

  downloadCsv(): void {
    const id = this.importSummary()?.statementId;
    if (!id) return;
    // Use a temporary anchor to trigger the browser download
    const a = document.createElement('a');
    a.href = `/api/bank-statements/${id}/export`;
    a.download = '';
    a.click();
  }

  printPdf(): void {
    window.print();
  }

  statusBadgeClass(status?: ReconciliationStatus): string {
    switch (status) {
      case 'AutoMatched': return 'badge bg-success';
      case 'ManualSuggestion': return 'badge bg-warning text-dark';
      case 'Unmatched': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }
}
