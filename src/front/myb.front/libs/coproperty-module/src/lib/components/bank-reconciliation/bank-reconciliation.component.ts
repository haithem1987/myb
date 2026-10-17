import { Component, signal, inject, DestroyRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import {
  BankReconciliationService,
  FundCallSummary,
  ImportSummary,
  ReconciliationDetail,
  ReconciliationItem,
} from '../../services/bank-reconciliation.service';
import { ActiveCopropertyService } from '../../services/active-coproperty.service';
import { ToastService } from 'libs/shared/infra/services/toast.service';

@Component({
  selector: 'myb-bank-reconciliation',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
          <div class="summary-value">{{ summary()!.TransactionCount }}</div>
          <div class="summary-label">Transactions</div>
        </div>
        <div class="summary-card matched">
          <div class="summary-value">{{ summary()!.AutoMatched }}</div>
          <div class="summary-label">Rapprochés auto</div>
        </div>
        <div class="summary-card suggestion">
          <div class="summary-value">{{ summary()!.ManualSuggestions }}</div>
          <div class="summary-label">Suggestions manuelles</div>
        </div>
        <div class="summary-card unmatched">
          <div class="summary-value">{{ summary()!.Unmatched }}</div>
          <div class="summary-label">Non rapprochés</div>
        </div>
      </div>

      <!-- Reconciliation Table -->
      <div class="table-card" *ngIf="detail()">
        <div class="table-header">
          <h2><i class="bi bi-table me-2"></i>{{ detail()!.FileName }}</h2>
          <a [href]="exportUrl()" class="btn-export" download>
            <i class="bi bi-download me-1"></i>Exporter CSV
          </a>
        </div>

        <!-- Filters -->
        <div class="filters-bar">
          <input class="filter-search"
                 type="text"
                 [(ngModel)]="filterText"
                 placeholder="Rechercher libellé, référence, copropriétaire…"
                 autocomplete="off">
          <div class="filter-group">
            <button class="filter-btn" [class.active]="filterType === 'all'"   (click)="filterType = 'all'">Tous</button>
            <button class="filter-btn credit" [class.active]="filterType === 'credit'" (click)="filterType = 'credit'">Crédits</button>
            <button class="filter-btn debit"  [class.active]="filterType === 'debit'"  (click)="filterType = 'debit'">Débits</button>
          </div>
          <div class="filter-group">
            <button class="filter-btn" [class.active]="filterStatus === 'all'"        (click)="filterStatus = 'all'">Tous statuts</button>
            <button class="filter-btn" [class.active]="filterStatus === 'matched'"    (click)="filterStatus = 'matched'">Rapprochés</button>
            <button class="filter-btn" [class.active]="filterStatus === 'suggestion'" (click)="filterStatus = 'suggestion'">Suggestions</button>
            <button class="filter-btn" [class.active]="filterStatus === 'unmatched'"  (click)="filterStatus = 'unmatched'">Non rapprochés</button>
          </div>
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
                <th>Appel de fonds</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of filteredItems()"
                  [class.row-registered]="item.Reconciliation.FundCallPaymentId">
                <td>{{ formatDate(item.Transaction.Date) }}</td>
                <td>{{ item.Transaction.Label }}</td>
                <td class="text-muted">{{ item.Transaction.Reference || '—' }}</td>
                <td class="text-end amount"
                    [class.positive]="item.Transaction.Amount > 0"
                    [class.negative]="item.Transaction.Amount < 0">
                  {{ item.Transaction.Amount > 0 ? '+' : '' }}{{ formatAmount(item.Transaction.Amount) }}
                </td>
                <td>
                  <span class="badge" [ngClass]="statusClass(item.Reconciliation.Status)">
                    {{ statusLabel(item.Reconciliation.Status) }}
                  </span>
                  <i *ngIf="item.Reconciliation.IsManuallyValidated"
                     class="bi bi-person-check ms-1" title="Validé manuellement"></i>
                </td>
                <td>
                  <!-- Registered in coproperty-service -->
                  <span *ngIf="item.Reconciliation.FundCallPaymentId" class="fc-registered">
                    <i class="bi bi-check-circle-fill text-success me-1"></i>Enregistré
                  </span>
                  <!-- Debit: cannot be reconciled with a fund call -->
                  <span *ngIf="!item.Reconciliation.FundCallPaymentId && item.Transaction.Amount < 0"
                        class="text-muted small fc-debit" title="Les débits ne sont pas liés à un appel de fonds">
                    <i class="bi bi-dash-circle me-1"></i>Débit
                  </span>
                  <!-- Step 1 + 2: owner select then fund call select for credits -->
                  <div *ngIf="!item.Reconciliation.FundCallPaymentId && item.Transaction.Amount > 0 && (item.Reconciliation.Status === 1 || item.Reconciliation.Status === 2)"
                       class="fc-selector">
                    <!-- Step 1: pick owner from dropdown -->
                    <select class="fc-search"
                            [(ngModel)]="ownerSearch[item.Reconciliation.Id]">
                      <option value="">— Copropriétaire —</option>
                      <option *ngFor="let o of distinctOwners()" [value]="o">{{ o }}</option>
                    </select>
                    <!-- Step 2: fund calls for selected owner -->
                    <select *ngIf="ownerSearch[item.Reconciliation.Id]?.trim()"
                            class="fc-select"
                            [(ngModel)]="pendingFundCallIds[item.Reconciliation.Id]">
                      <option value="">— Appel de fonds —</option>
                      <option *ngFor="let fc of fundCallsForOwner(ownerSearch[item.Reconciliation.Id])" [value]="fc.Id">
                        {{ fc.Description || fc.OwnerName }} — {{ formatAmount(fc.Amount) }}
                      </option>
                    </select>
                  </div>
                  <span *ngIf="!item.Reconciliation.FundCallPaymentId && item.Transaction.Amount > 0 && item.Reconciliation.Status === 0"
                        class="text-muted small">—</span>
                </td>
                <td>
                  <!-- Already validated and registered: nothing to do -->
                  <span *ngIf="item.Reconciliation.FundCallPaymentId" class="text-muted small">✓</span>

                  <!-- Validate button for ManualSuggestion / Unmatched -->
                  <ng-container *ngIf="!item.Reconciliation.FundCallPaymentId && (item.Reconciliation.Status === 1 || item.Reconciliation.Status === 2)">
                    <!-- Credit: require a fund call to be selected -->
                    <span *ngIf="item.Transaction.Amount > 0 && !pendingFundCallIds[item.Reconciliation.Id]"
                          class="fc-required-hint">
                      <i class="bi bi-exclamation-circle me-1"></i>Sélectionnez un appel de fonds
                    </span>
                    <button
                      *ngIf="item.Transaction.Amount < 0 || pendingFundCallIds[item.Reconciliation.Id]"
                      class="btn-validate"
                      [disabled]="validating() === item.Reconciliation.Id"
                      (click)="validate(item)">
                      <span *ngIf="validating() !== item.Reconciliation.Id">
                        {{ pendingFundCallIds[item.Reconciliation.Id] ? 'Valider + Enregistrer' : 'Valider' }}
                      </span>
                      <span *ngIf="validating() === item.Reconciliation.Id" class="spinner-sm"></span>
                    </button>
                  </ng-container>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reconciliation-page { padding: 24px; max-width: 1400px; margin: 0 auto; }

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
    .row-registered { background: #f0fdf4; }
    .text-end { text-align: right; }
    .text-muted { color: #a0aec0; }
    .amount { font-weight: 600; }
    .amount.positive { color: #16a34a; }
    .amount.negative { color: #dc2626; }

    .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .badge-success  { background: #dcfce7; color: #15803d; }
    .badge-warning  { background: #fef3c7; color: #92400e; }
    .badge-danger   { background: #fee2e2; color: #b91c1c; }

    .fc-registered { font-size: 0.82rem; color: #15803d; font-weight: 500; }
    .fc-debit { font-size: 0.8rem; color: #9ca3af; }
    .fc-selector { display: flex; flex-direction: column; gap: 4px; min-width: 200px; }
    .fc-search {
      font-size: 0.8rem;
      padding: 3px 8px;
      border: 1px solid #cbd5e0;
      border-radius: 5px;
      background: white;
      color: #374151;
      width: 100%;
    }
    .fc-search:focus { outline: none; border-color: #4f46e5; }
    .fc-select {
      font-size: 0.8rem;
      padding: 3px 6px;
      border: 1px solid #cbd5e0;
      border-radius: 5px;
      background: white;
      color: #374151;
      max-width: 280px;
    }
    .fc-select:focus { outline: none; border-color: #4f46e5; }

    .btn-validate {
      padding: 4px 12px;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8rem;
      display: inline-flex; align-items: center; gap: 4px;
      white-space: nowrap;
    }
    .btn-validate:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-validate:not(:disabled):hover { background: #4338ca; }

    .filters-bar {
      display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
      padding: 12px 20px;
      border-bottom: 1px solid #f0f0f0;
      background: #fafbfc;
    }
    .filter-search {
      flex: 1; min-width: 200px;
      padding: 6px 12px;
      border: 1px solid #cbd5e0;
      border-radius: 6px;
      font-size: 0.85rem;
      background: white;
    }
    .filter-search:focus { outline: none; border-color: #4f46e5; }
    .filter-group { display: flex; gap: 4px; }
    .filter-btn {
      padding: 4px 12px;
      font-size: 0.8rem;
      border: 1px solid #cbd5e0;
      border-radius: 5px;
      background: white;
      cursor: pointer;
      color: #4a5568;
      transition: all 0.15s;
    }
    .filter-btn:hover { background: #f1f5f9; }
    .filter-btn.active { background: #4f46e5; color: white; border-color: #4f46e5; }
    .filter-btn.credit.active { background: #15803d; border-color: #15803d; }
    .filter-btn.debit.active  { background: #b91c1c; border-color: #b91c1c; }

    .fc-required-hint { font-size: 0.78rem; color: #d97706; white-space: nowrap; }
  `],
})
export class BankReconciliationComponent {
  private service = inject(BankReconciliationService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private activeCoproperty = inject(ActiveCopropertyService);

  isDragOver = signal(false);
  uploading = signal(false);
  validating = signal<string | null>(null);
  summary = signal<ImportSummary | null>(null);
  detail = signal<ReconciliationDetail | null>(null);
  availableFundCalls = signal<FundCallSummary[]>([]);
  fundCallsLoaded = false;

  constructor() {
    effect(() => {
      const id = this.activeCoproperty.activeId();
      if (id) this.loadFundCallsIfNeeded();
    });
  }

  // Maps reconciliationId → selected FundCallId (for the dropdown)
  pendingFundCallIds: Record<string, string> = {};
  // Per-row: the owner name typed in the first step of the fund-call selector
  ownerSearch: Record<string, string> = {};

  // Filter state
  filterText = '';
  filterType: 'all' | 'credit' | 'debit' = 'all';
  filterStatus: 'all' | 'matched' | 'suggestion' | 'unmatched' = 'all';

  filteredItems() {
    const items = this.detail()?.Items ?? [];
    const q = this.filterText.trim().toLowerCase();
    return items.filter(item => {
      const t = item.Transaction;
      const r = item.Reconciliation;
      if (this.filterType === 'credit' && t.Amount <= 0) return false;
      if (this.filterType === 'debit'  && t.Amount >= 0) return false;
      if (this.filterStatus === 'matched'    && r.Status !== 0) return false;
      if (this.filterStatus === 'suggestion' && r.Status !== 1) return false;
      if (this.filterStatus === 'unmatched'  && r.Status !== 2) return false;
      if (!q) return true;
      const ownerName = (this.availableFundCalls().find(fc => fc.Id === r.FundCallId)?.OwnerName ?? '').toLowerCase();
      return (t.Label ?? '').toLowerCase().includes(q)
          || (t.Reference ?? '').toLowerCase().includes(q)
          || ownerName.includes(q);
    });
  }

  distinctOwners(): string[] {
    return [...new Set(
      this.availableFundCalls()
        .map(fc => fc.OwnerName ?? '')
        .filter(n => n.length > 0)
    )].sort();
  }

  fundCallsForOwner(ownerName: string): FundCallSummary[] {
    if (!ownerName.trim()) return [];
    const q = ownerName.trim().toLowerCase();
    return this.availableFundCalls().filter(fc =>
      (fc.OwnerName ?? '').toLowerCase().includes(q)
    );
  }

  exportUrl(): string {
    const d = this.detail();
    return d ? this.service.getExportUrl(d.Id) : '#';
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

  loadFundCallsIfNeeded(): void {
    if (this.fundCallsLoaded) return;
    const copropertyId = this.activeCoproperty.activeId();
    if (!copropertyId) return;

    this.service.getActiveFundCalls(copropertyId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.availableFundCalls.set(list);
          this.fundCallsLoaded = true;
        },
        error: () => {
          this.toastService.show(
            'Impossible de charger les appels de fonds.',
            { classname: 'bg-warning text-dark', delay: 4000 }
          );
        }
      });
  }

  private upload(file: File): void {
    this.uploading.set(true);
    this.summary.set(null);
    this.detail.set(null);
    this.pendingFundCallIds = {};
    this.ownerSearch = {};

    this.service.importStatement(file)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.uploading.set(false))
      )
      .subscribe({
        next: (result) => {
          this.summary.set(result);
          this.toastService.show(
            `Import réussi : ${result.TransactionCount} transactions (${result.AutoMatched} rapprochées automatiquement)`,
            { classname: 'bg-success text-white', delay: 5000 }
          );
          this.loadDetail(result.StatementId);
        },
        error: () => {
          this.toastService.show(
            "Erreur lors de l'import. Vérifiez le format du fichier.",
            { classname: 'bg-danger text-white', delay: 5000 }
          );
        },
      });
  }

  private loadDetail(statementId: string): void {
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

  validate(item: ReconciliationItem): void {
    const s = this.summary();
    if (!s) return;
    const fundCallId = this.pendingFundCallIds[item.Reconciliation.Id] || undefined;
    this.validating.set(item.Reconciliation.Id);

    this.service.validate(s.StatementId, item.Reconciliation.Id, fundCallId)
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
              Items: d.Items.map(i =>
                i.Reconciliation.Id === updated.Id ? { ...i, Reconciliation: updated } : i
              ),
            });
          }
          const msg = updated.FundCallPaymentId
            ? 'Transaction validée et paiement enregistré dans la copropriété.'
            : 'Transaction validée.';
          this.toastService.show(msg, { classname: 'bg-success text-white', delay: 4000 });
        },
        error: () => {
          this.toastService.show('Erreur lors de la validation.', { classname: 'bg-danger text-white', delay: 4000 });
        },
      });
  }

  statusClass(status: number): Record<string, boolean> {
    return {
      'badge-success': status === 0,
      'badge-warning': status === 1,
      'badge-danger': status === 2,
    };
  }

  statusLabel(status: number): string {
    if (status === 0) return 'Rapproché';
    if (status === 1) return 'Suggestion';
    return 'Non rapproché';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(amount);
  }
}
