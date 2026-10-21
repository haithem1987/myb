import { Component, signal, inject, DestroyRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import {
  BankReconciliationService,
  FundCallSummary,
  ImportSummary,
  ReconciliationDetail,
  ReconciliationItem,
  StatementListItem,
} from '../../services/bank-reconciliation.service';
import { ActiveCopropertyService } from '../../services/active-coproperty.service';
import { ToastService } from 'libs/shared/infra/services/toast.service';

@Component({
  selector: 'myb-bank-reconciliation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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

      <!-- Feature 5: Previous imports list -->
      <div class="prev-imports" *ngIf="!detail() && previousImports().length > 0">
        <h3><i class="bi bi-clock-history me-2"></i>Imports précédents</h3>
        <div class="prev-list">
          <div class="prev-item" *ngFor="let s of previousImports()">
            <div class="prev-file" (click)="loadPreviousImport(s)">
              <i class="bi bi-file-earmark-text me-1"></i>{{ s.FileName }}
            </div>
            <div class="prev-meta">
              <span (click)="loadPreviousImport(s)" style="cursor:pointer">{{ formatDate(s.ImportedAt) }}</span>
              <span class="prev-badge matched" (click)="loadPreviousImport(s)" style="cursor:pointer">{{ s.AutoMatched }} rapprochés</span>
              <span class="prev-badge unmatched" *ngIf="s.Unmatched > 0" (click)="loadPreviousImport(s)" style="cursor:pointer">{{ s.Unmatched }} non rapprochés</span>
              <button class="btn-delete-import"
                      [disabled]="deletingId() === s.Id"
                      (click)="$event.stopPropagation(); deleteStatement(s)"
                      title="Supprimer cet import">
                <span *ngIf="deletingId() !== s.Id"><i class="bi bi-trash3"></i></span>
                <span *ngIf="deletingId() === s.Id" class="spinner-sm"></span>
              </button>
            </div>
          </div>
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
        <!-- Feature 1: live counter -->
        <div class="summary-card unmatched">
          <div class="summary-value">{{ liveUnmatched() }}</div>
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
          <!-- Feature 3: bulk validate debits -->
          <button class="btn-bulk-debit"
                  *ngIf="unmatchedDebits().length > 0 && filterStatus === 'unmatched'"
                  [disabled]="bulkValidating()"
                  (click)="validateAllDebits()">
            <span *ngIf="!bulkValidating()"><i class="bi bi-check2-all me-1"></i>Valider tous les débits ({{ unmatchedDebits().length }})</span>
            <span *ngIf="bulkValidating()" class="spinner-sm"></span>
          </button>
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
                  <!-- Feature 4: link to fund call when registered -->
                  <a *ngIf="item.Reconciliation.FundCallPaymentId && item.Reconciliation.FundCallId"
                     [routerLink]="fundCallRoute(item.Reconciliation.FundCallId!)"
                     class="fc-registered-link">
                    <i class="bi bi-check-circle-fill text-success me-1"></i>
                    {{ fundCallLabel(item.Reconciliation.FundCallId!) }}
                  </a>
                  <span *ngIf="item.Reconciliation.FundCallPaymentId && !item.Reconciliation.FundCallId"
                        class="fc-registered">
                    <i class="bi bi-check-circle-fill text-success me-1"></i>Enregistré
                  </span>
                  <!-- Debit: cannot be reconciled with a fund call -->
                  <span *ngIf="!item.Reconciliation.FundCallPaymentId && item.Transaction.Amount < 0"
                        class="text-muted small fc-debit" title="Les débits ne sont pas liés à un appel de fonds">
                    <i class="bi bi-dash-circle me-1"></i>Débit
                  </span>
                  <!-- Modal trigger for credits needing a fund call -->
                  <div *ngIf="!item.Reconciliation.FundCallPaymentId && item.Transaction.Amount > 0 && (item.Reconciliation.Status === 1 || item.Reconciliation.Status === 2)"
                       class="fc-selector">
                    <button class="btn-pick-fc"
                            [class.has-selection]="pendingFundCallIds[item.Reconciliation.Id]"
                            (click)="openFcModal(item.Reconciliation.Id)">
                      <i class="bi" [class.bi-search]="!pendingFundCallIds[item.Reconciliation.Id]"
                                    [class.bi-check-circle]="pendingFundCallIds[item.Reconciliation.Id]"></i>
                      {{ pendingFundCallIds[item.Reconciliation.Id]
                           ? fundCallLabel(pendingFundCallIds[item.Reconciliation.Id])
                           : 'Sélectionner un appel de fonds' }}
                    </button>
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
                      [disabled]="validating() === item.Reconciliation.Id || bulkValidating()"
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

    <!-- Fund Call picker modal -->
    <div class="modal-backdrop" *ngIf="fcModalOpen()" (click)="closeFcModal()"></div>
    <div class="fc-modal" *ngIf="fcModalOpen()" role="dialog" aria-modal="true">
      <div class="fc-modal-header">
        <h3><i class="bi bi-card-checklist me-2"></i>Sélectionner un appel de fonds</h3>
        <button class="fc-modal-close" (click)="closeFcModal()"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="fc-modal-search">
        <input type="text" class="filter-search" [(ngModel)]="fcModalSearch"
               placeholder="Rechercher par copropriétaire, description…" autocomplete="off">
      </div>
      <div class="fc-modal-body">
        <div *ngIf="availableFundCalls().length === 0" class="fc-empty">
          <i class="bi bi-inbox" style="font-size:2.5rem;color:#a0aec0"></i>
          <p class="mt-2" style="color:#6c757d">Aucun appel de fonds disponible.</p>
          <p style="font-size:.85rem;color:#9ca3af">Créez des appels de fonds dans la section <strong>Appels de fonds</strong> pour pouvoir les lier aux transactions.</p>
          <a [routerLink]="['/coproperty', activeCopropertyId(), 'syndic', 'fund-calls']"
             class="btn-validate mt-2" style="text-decoration:none;display:inline-flex" (click)="closeFcModal()">
            <i class="bi bi-plus-circle me-1"></i>Créer des appels de fonds
          </a>
        </div>
        <div *ngIf="availableFundCalls().length > 0 && fcModalFiltered().length === 0" class="fc-empty">
          <i class="bi bi-search" style="font-size:1.5rem;color:#a0aec0"></i>
          <p class="mt-2" style="color:#6c757d">Aucun résultat pour « {{ fcModalSearch }} »</p>
        </div>
        <div *ngFor="let fc of fcModalFiltered()"
             class="fc-modal-item"
             [class.fc-modal-item-selected]="pendingFundCallIds[fcModalReconciliationId()] === fc.Id"
             (click)="selectFcInModal(fc.Id)">
          <div class="fc-modal-item-top">
            <span class="fc-modal-item-name"><i class="bi bi-person me-1"></i>{{ fc.OwnerName || '—' }}</span>
            <span class="fc-modal-amount">{{ formatAmount(fc.Amount) }}</span>
          </div>
          <div class="fc-modal-item-bottom">
            <span style="color:#6c757d;font-size:.82rem">{{ fc.Description }}</span>
            <span class="fc-modal-due">Éch. {{ formatDate(fc.DueDate) }}</span>
          </div>
        </div>
      </div>
      <div class="fc-modal-footer">
        <button class="btn-validate" (click)="confirmFcModal()" [disabled]="!pendingFundCallIds[fcModalReconciliationId()]">
          Confirmer
        </button>
        <button class="fc-modal-cancel" (click)="closeFcModal()">Annuler</button>
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

    .prev-imports { margin-bottom: 24px; }
    .prev-imports h3 { font-size: 1rem; font-weight: 600; color: #374151; margin: 0 0 10px; }
    .prev-list { display: flex; flex-direction: column; gap: 6px; }
    .prev-item {
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;
      padding: 10px 16px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .prev-item:hover { border-color: #4f46e5; background: #f5f3ff; }
    .prev-file { font-size: 0.875rem; font-weight: 500; color: #374151; }
    .prev-meta { display: flex; align-items: center; gap: 8px; font-size: 0.78rem; color: #9ca3af; }
    .prev-badge { padding: 2px 8px; border-radius: 10px; font-weight: 600; }
    .prev-badge.matched { background: #dcfce7; color: #15803d; }
    .prev-badge.unmatched { background: #fee2e2; color: #b91c1c; }

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
    .fc-registered-link {
      font-size: 0.82rem; color: #4f46e5; font-weight: 500;
      text-decoration: none; display: inline-flex; align-items: center; gap: 2px;
    }
    .fc-registered-link:hover { text-decoration: underline; }
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

    .btn-bulk-debit {
      padding: 5px 14px;
      background: #b91c1c;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8rem;
      display: inline-flex; align-items: center; gap: 4px;
      white-space: nowrap;
      margin-left: auto;
    }
    .btn-bulk-debit:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-bulk-debit:not(:disabled):hover { background: #991b1b; }

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

    /* Fund call picker button */
    .btn-pick-fc {
      padding: 4px 10px;
      font-size: 0.8rem;
      background: #f1f5f9;
      border: 1px dashed #cbd5e0;
      border-radius: 6px;
      cursor: pointer;
      color: #4a5568;
      display: inline-flex; align-items: center; gap: 5px;
      white-space: nowrap;
      transition: all 0.15s;
    }
    .btn-pick-fc:hover { background: #e8edf7; border-color: #4f46e5; color: #4f46e5; }
    .btn-pick-fc.has-selection { background: #ede9fe; border-color: #7c3aed; color: #5b21b6; border-style: solid; }

    /* Delete import button */
    .btn-delete-import {
      padding: 2px 7px;
      background: transparent;
      border: 1px solid #fca5a5;
      border-radius: 5px;
      cursor: pointer;
      color: #dc2626;
      font-size: 0.78rem;
      transition: all 0.15s;
    }
    .btn-delete-import:hover:not(:disabled) { background: #fee2e2; }
    .btn-delete-import:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Modal */
    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.4);
      z-index: 1000;
    }
    .fc-modal {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1001;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      width: min(560px, 95vw);
      display: flex; flex-direction: column;
      max-height: 80vh;
    }
    .fc-modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #f0f0f0;
    }
    .fc-modal-header h3 { font-size: 1rem; font-weight: 600; margin: 0; }
    .fc-modal-close {
      background: none; border: none; cursor: pointer;
      color: #9ca3af; font-size: 1rem; padding: 4px;
      border-radius: 4px; transition: color 0.15s;
    }
    .fc-modal-close:hover { color: #374151; }
    .fc-modal-search { padding: 12px 20px; border-bottom: 1px solid #f0f0f0; }
    .fc-modal-body { overflow-y: auto; flex: 1; padding: 8px 0; }
    .fc-empty { text-align: center; padding: 32px 24px; }
    .fc-modal-item {
      padding: 10px 20px;
      cursor: pointer;
      border-bottom: 1px solid #f8fafc;
      transition: background 0.1s;
    }
    .fc-modal-item:hover { background: #f5f3ff; }
    .fc-modal-item-selected { background: #ede9fe !important; }
    .fc-modal-item-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
    .fc-modal-item-name { font-weight: 500; font-size: 0.875rem; color: #1a202c; }
    .fc-modal-item-bottom { display: flex; justify-content: space-between; }
    .fc-modal-amount { font-weight: 600; font-size: 0.875rem; color: #4f46e5; }
    .fc-modal-due { font-size: 0.78rem; color: #9ca3af; }
    .fc-modal-footer {
      display: flex; gap: 8px; justify-content: flex-end;
      padding: 12px 20px;
      border-top: 1px solid #f0f0f0;
    }
    .fc-modal-cancel {
      padding: 6px 16px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
    }
    .fc-modal-cancel:hover { background: #e2e8f0; }
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
  bulkValidating = signal(false);
  deletingId = signal<string | null>(null);

  activeCopropertyId = () => this.activeCoproperty.activeId() ?? '';
  summary = signal<ImportSummary | null>(null);
  detail = signal<ReconciliationDetail | null>(null);
  availableFundCalls = signal<FundCallSummary[]>([]);
  fundCallsLoaded = false;
  // Feature 5: previous imports
  previousImports = signal<StatementListItem[]>([]);

  constructor() {
    effect(() => {
      const id = this.activeCoproperty.activeId();
      if (id) {
        this.loadFundCallsIfNeeded();
        this.loadPreviousImports(id);
      }
    });
  }

  pendingFundCallIds: Record<string, string> = {};
  ownerSearch: Record<string, string> = {};

  // Modal state
  private _fcModalRecId = signal<string | null>(null);
  fcModalOpen = signal(false);
  fcModalSearch = '';
  fcModalReconciliationId = () => this._fcModalRecId() ?? '';

  fcModalFiltered(): FundCallSummary[] {
    const q = this.fcModalSearch.trim().toLowerCase();
    if (!q) return this.availableFundCalls();
    return this.availableFundCalls().filter(fc =>
      (fc.OwnerName ?? '').toLowerCase().includes(q) ||
      (fc.Description ?? '').toLowerCase().includes(q)
    );
  }

  openFcModal(reconciliationId: string): void {
    this._fcModalRecId.set(reconciliationId);
    this.fcModalSearch = '';
    this.fcModalOpen.set(true);
  }

  closeFcModal(): void {
    this.fcModalOpen.set(false);
  }

  selectFcInModal(fundCallId: string): void {
    const id = this._fcModalRecId();
    if (id) this.pendingFundCallIds[id] = fundCallId;
  }

  confirmFcModal(): void {
    this.fcModalOpen.set(false);
  }

  filterText = '';
  filterType: 'all' | 'credit' | 'debit' = 'all';
  filterStatus: 'all' | 'matched' | 'suggestion' | 'unmatched' = 'all';

  // Feature 1: live unmatched count derived from detail()
  liveUnmatched(): number {
    const d = this.detail();
    if (!d) return this.summary()?.Unmatched ?? 0;
    return d.Items.filter(i => i.Reconciliation.Status !== 0 && !i.Reconciliation.FundCallPaymentId
      && (i.Reconciliation.Status === 1 || i.Reconciliation.Status === 2)).length;
  }

  // Feature 3: unmatched debits for bulk action
  unmatchedDebits(): ReconciliationItem[] {
    const d = this.detail();
    if (!d) return [];
    return d.Items.filter(i =>
      i.Transaction.Amount < 0 &&
      !i.Reconciliation.FundCallPaymentId &&
      (i.Reconciliation.Status === 1 || i.Reconciliation.Status === 2)
    );
  }

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

  // Feature 4: build route to fund call detail
  fundCallRoute(fundCallId: string): string[] {
    const copropertyId = this.activeCoproperty.activeId() ?? '';
    return ['/coproperty', copropertyId, 'syndic', 'fund-calls', fundCallId];
  }

  fundCallLabel(fundCallId: string): string {
    const fc = this.availableFundCalls().find(f => f.Id === fundCallId);
    return fc ? (fc.Description || 'Appel de fonds') : 'Enregistré';
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

  // Feature 5: load previous imports
  private loadPreviousImports(copropertyId: string): void {
    this.service.listStatements(copropertyId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (list) => this.previousImports.set(list) });
  }

  loadPreviousImport(s: StatementListItem): void {
    this.summary.set({
      StatementId: s.Id,
      FileName: s.FileName,
      TransactionCount: s.TransactionCount,
      AutoMatched: s.AutoMatched,
      ManualSuggestions: s.ManualSuggestions,
      Unmatched: s.Unmatched,
    });
    this.pendingFundCallIds = {};
    this.ownerSearch = {};
    this.loadDetail(s.Id);
  }

  private upload(file: File): void {
    const copropertyId = this.activeCoproperty.activeId();
    if (!copropertyId) return;
    this.uploading.set(true);
    this.summary.set(null);
    this.detail.set(null);
    this.pendingFundCallIds = {};
    this.ownerSearch = {};

    this.service.importStatement(file, copropertyId)
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
          this.loadPreviousImports(copropertyId);
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
        next: (d) => {
          this.detail.set(d);
          // Feature 2: auto-detect owner from transaction label after detail loads
          this.autoDetectOwners(d);
        },
        error: () => {
          this.toastService.show(
            'Erreur lors du chargement des détails.',
            { classname: 'bg-danger text-white', delay: 4000 }
          );
        },
      });
  }

  // Feature 2: pre-select owner based on label keywords
  private autoDetectOwners(d: ReconciliationDetail): void {
    const owners = this.distinctOwners();
    if (!owners.length) return;
    for (const item of d.Items) {
      if (item.Transaction.Amount <= 0) continue;
      if (item.Reconciliation.Status === 0) continue;
      if (this.ownerSearch[item.Reconciliation.Id]) continue;
      const labelNorm = this.normalizeText(item.Transaction.Label);
      const matched = owners.find(owner => {
        const words = this.normalizeText(owner).split(/\s+/).filter(w => w.length >= 3);
        return words.some(w => labelNorm.includes(w));
      });
      if (matched) this.ownerSearch[item.Reconciliation.Id] = matched;
    }
  }

  private normalizeText(s: string): string {
    return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
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
          this.applyValidationResult(updated);
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

  // Feature 3: validate all unmatched debits sequentially
  async validateAllDebits(): Promise<void> {
    const s = this.summary();
    if (!s || this.bulkValidating()) return;
    this.bulkValidating.set(true);
    const debits = this.unmatchedDebits();
    let count = 0;
    for (const item of debits) {
      try {
        const updated = await this.service.validate(s.StatementId, item.Reconciliation.Id).toPromise();
        if (updated) { this.applyValidationResult(updated); count++; }
      } catch { /* continue */ }
    }
    this.bulkValidating.set(false);
    this.toastService.show(
      `${count} débit(s) validé(s).`,
      { classname: 'bg-success text-white', delay: 4000 }
    );
  }

  private applyValidationResult(updated: ReconciliationItem['Reconciliation']): void {
    const d = this.detail();
    if (d) {
      this.detail.set({
        ...d,
        Items: d.Items.map(i =>
          i.Reconciliation.Id === updated.Id ? { ...i, Reconciliation: updated } : i
        ),
      });
    }
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

  deleteStatement(s: StatementListItem): void {
    this.deletingId.set(s.Id);
    this.service.deleteStatement(s.Id)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.previousImports.update(list => list.filter(x => x.Id !== s.Id));
          if (this.summary()?.StatementId === s.Id) {
            this.summary.set(null);
            this.detail.set(null);
          }
          this.toastService.show('Import supprimé.', { classname: 'bg-success text-white', delay: 3000 });
        },
        error: () => {
          this.toastService.show('Erreur lors de la suppression.', { classname: 'bg-danger text-white', delay: 4000 });
        },
      });
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(amount);
  }
}
