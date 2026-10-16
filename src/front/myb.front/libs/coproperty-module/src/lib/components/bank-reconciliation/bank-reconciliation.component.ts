import { Component, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import {
  BankReconciliationService,
  ImportSummary,
  ReconciliationResult,
  ReconciliationDetail,
} from '../../services/bank-reconciliation.service';
import { ToastService } from 'libs/shared/infra/services/toast.service';

@Component({
  selector: 'myb-bank-reconciliation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reconciliation-page">
      <div class="page-header">
        <h1><i class="bi bi-arrow-left-right me-2"></i>Rapprochement bancaire</h1>
        <p class="subtitle">Importez un relevé bancaire (OFX, CSV ou PDF) pour rapprocher les transactions avec les paiements enregistrés.</p>
      </div>

      <!-- Upload Zone -->
      <div class="upload-card"
           [class.drag-over]="isDragOver()"
           (dragover)="onDragOver($event)"
           (dragleave)="onDragLeave()"
           (drop)="onDrop($event)">
        <div class="upload-inner" *ngIf="!uploading()">
          <i class="bi bi-cloud-upload upload-icon"></i>
          <p class="upload-label">Glissez votre fichier ici ou</p>
          <label class="btn-upload">
            <input type="file" accept=".ofx,.csv,.pdf,.qfx" (change)="onFileSelected($event)" hidden>
            Choisir un fichier
          </label>
          <p class="upload-hint">Formats acceptés : OFX, CSV, PDF</p>
        </div>
        <div class="upload-inner" *ngIf="uploading()">
          <div class="spinner"></div>
          <p>Import en cours…</p>
        </div>
      </div>

      <!-- Import Summary -->
      <div class="summary-cards" *ngIf="summary()">
        <div class="summary-card total">
          <div class="summary-value">{{ summary()!.transactionCount }}</div>
          <div class="summary-label">Transactions</div>
        </div>
        <div class="summary-card matched">
          <div class="summary-value">{{ summary()!.autoMatched }}</div>
          <div class="summary-label">Rapprochés auto</div>
        </div>
        <div class="summary-card suggestion">
          <div class="summary-value">{{ summary()!.manualSuggestions }}</div>
          <div class="summary-label">Suggestions manuelles</div>
        </div>
        <div class="summary-card unmatched">
          <div class="summary-value">{{ summary()!.unmatched }}</div>
          <div class="summary-label">Non rapprochés</div>
        </div>
      </div>

      <!-- Reconciliation Table -->
      <div class="table-card" *ngIf="detail()">
        <div class="table-header">
          <h2><i class="bi bi-table me-2"></i>{{ detail()!.fileName }}</h2>
          <a [href]="exportUrl()" class="btn-export" download>
            <i class="bi bi-download me-1"></i>Exporter CSV
          </a>
        </div>

        <div class="table-responsive">
          <table class="reconciliation-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Libellé</th>
                <th>Référence</th>
                <th class="text-end">Montant</th>
                <th>Statut</th>
                <th>Paiement associé</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of detail()!.results">
                <td>{{ formatDate(row.transactionDate) }}</td>
                <td>{{ row.description }}</td>
                <td class="text-muted">{{ row.reference || '—' }}</td>
                <td class="text-end amount" [class.negative]="row.amount < 0">
                  {{ formatAmount(row.amount) }}
                </td>
                <td>
                  <span class="badge" [ngClass]="statusClass(row.status)">
                    {{ statusLabel(row.status) }}
                  </span>
                </td>
                <td>
                  <span *ngIf="row.matchedPayment">
                    {{ formatAmount(row.matchedPayment.amount) }} — {{ formatDate(row.matchedPayment.paymentDate) }}
                  </span>
                  <span *ngIf="!row.matchedPayment" class="text-muted">—</span>
                </td>
                <td>
                  <button
                    *ngIf="row.status === 'ManualSuggestion' || row.status === 'Unmatched'"
                    class="btn-validate"
                    [disabled]="validating() === row.id"
                    (click)="validate(row)">
                    <span *ngIf="validating() !== row.id">Valider</span>
                    <span *ngIf="validating() === row.id" class="spinner-sm"></span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reconciliation-page { padding: 24px; max-width: 1200px; margin: 0 auto; }

    .page-header { margin-bottom: 24px; }
    .page-header h1 { font-size: 1.6rem; font-weight: 700; color: #1a202c; margin: 0 0 6px; }
    .subtitle { color: #6c757d; margin: 0; }

    .upload-card {
      border: 2px dashed #cbd5e0;
      border-radius: 12px;
      background: #f8fafc;
      padding: 40px 20px;
      text-align: center;
      transition: border-color 0.2s, background 0.2s;
      margin-bottom: 24px;
      cursor: default;
    }
    .upload-card.drag-over { border-color: #4f46e5; background: #eef2ff; }
    .upload-inner { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .upload-icon { font-size: 3rem; color: #a0aec0; }
    .upload-label { color: #4a5568; margin: 0; }
    .upload-hint { color: #a0aec0; font-size: 0.85rem; margin: 0; }
    .btn-upload {
      display: inline-block;
      padding: 8px 20px;
      background: #4f46e5;
      color: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .btn-upload:hover { background: #4338ca; }

    .spinner {
      width: 36px; height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: #4f46e5;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .spinner-sm {
      display: inline-block;
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .summary-cards { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .summary-card {
      flex: 1; min-width: 120px;
      border-radius: 10px;
      padding: 16px 20px;
      text-align: center;
    }
    .summary-card.total    { background: #e8edf7; }
    .summary-card.matched  { background: #dcfce7; }
    .summary-card.suggestion { background: #fef3c7; }
    .summary-card.unmatched  { background: #fee2e2; }
    .summary-value { font-size: 2rem; font-weight: 700; }
    .summary-label { font-size: 0.8rem; color: #6c757d; margin-top: 4px; }

    .table-card { background: white; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,.08); overflow: hidden; }
    .table-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #f0f0f0;
    }
    .table-header h2 { font-size: 1.1rem; font-weight: 600; margin: 0; }
    .btn-export {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 6px 14px;
      background: #f1f5f9;
      color: #374151;
      border-radius: 6px;
      text-decoration: none;
      font-size: 0.85rem;
    }
    .btn-export:hover { background: #e2e8f0; }

    .table-responsive { overflow-x: auto; }
    .reconciliation-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .reconciliation-table th {
      padding: 10px 16px;
      background: #f8fafc;
      font-weight: 600;
      color: #6c757d;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }
    .reconciliation-table td {
      padding: 10px 16px;
      border-bottom: 1px solid #f0f4f8;
      vertical-align: middle;
    }
    .reconciliation-table tr:last-child td { border-bottom: none; }
    .text-end { text-align: right; }
    .text-muted { color: #a0aec0; }
    .amount { font-weight: 500; }
    .amount.negative { color: #dc2626; }

    .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .badge-success  { background: #dcfce7; color: #15803d; }
    .badge-warning  { background: #fef3c7; color: #92400e; }
    .badge-danger   { background: #fee2e2; color: #b91c1c; }

    .btn-validate {
      padding: 4px 12px;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8rem;
      display: inline-flex; align-items: center; gap: 4px;
    }
    .btn-validate:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-validate:not(:disabled):hover { background: #4338ca; }
  `],
})
export class BankReconciliationComponent {
  private service = inject(BankReconciliationService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  isDragOver = signal(false);
  uploading = signal(false);
  validating = signal<number | null>(null);
  summary = signal<ImportSummary | null>(null);
  detail = signal<ReconciliationDetail | null>(null);

  exportUrl(): string {
    const s = this.summary();
    return s ? this.service.getExportUrl(s.statementId) : '#';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.upload(file);
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.upload(file);
  }

  private upload(file: File): void {
    this.uploading.set(true);
    this.summary.set(null);
    this.detail.set(null);

    this.service.importStatement(file)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.uploading.set(false))
      )
      .subscribe({
        next: (result) => {
          this.summary.set(result);
          this.toastService.show(
            `Import réussi : ${result.transactionCount} transactions (${result.autoMatched} rapprochées automatiquement)`,
            { classname: 'bg-success text-white', delay: 5000 }
          );
          this.loadDetail(result.statementId);
        },
        error: () => {
          this.toastService.show(
            "Erreur lors de l'import. Vérifiez le format du fichier.",
            { classname: 'bg-danger text-white', delay: 5000 }
          );
        },
      });
  }

  private loadDetail(statementId: number): void {
    this.service.getReconciliation(statementId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (d) => this.detail.set(d),
        error: () => {
          this.toastService.show(
            'Erreur lors du chargement des détails.',
            { classname: 'bg-danger text-white', delay: 4000 }
          );
        },
      });
  }

  validate(row: ReconciliationResult): void {
    const s = this.summary();
    if (!s) return;
    this.validating.set(row.id);

    this.service.validate(s.statementId, row.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.validating.set(null))
      )
      .subscribe({
        next: (updated) => {
          const d = this.detail();
          if (d) {
            this.detail.set({
              ...d,
              results: d.results.map(r => r.id === updated.id ? updated : r),
            });
          }
          this.toastService.show('Transaction validée.', { classname: 'bg-success text-white', delay: 3000 });
        },
        error: () => {
          this.toastService.show('Erreur lors de la validation.', { classname: 'bg-danger text-white', delay: 4000 });
        },
      });
  }

  statusClass(status: string): Record<string, boolean> {
    return {
      'badge-success': status === 'AutoMatched',
      'badge-warning': status === 'ManualSuggestion',
      'badge-danger': status === 'Unmatched',
    };
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'AutoMatched': return 'Rapproché';
      case 'ManualSuggestion': return 'Suggestion';
      case 'Unmatched': return 'Non rapproché';
      default: return status;
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  }
}
