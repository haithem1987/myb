import { Component, signal, inject, computed, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService, FileDownloadService, ToastService, NotificationService } from '@myb-front/shared-ui';
import { OwnerService, CopropertyInvoice, InvoiceStatus, Unit, CurrencyService, ChargeDistribution, FundCallService } from '../../../index';
import { FundCallPaymentWithContext } from '../../../models/fund-call.model';
import { KeycloakService } from '@myb-front/auth';
import { forkJoin, of } from 'rxjs';
import { catchError, take, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface Invoice {
  id: string;
  number: string;
  description: string;
  date: Date;
  amount: number;
  period: string;
  unitNumber: string;
  paymentDate?: Date;
  paymentMethod: string;
  status: string;
  downloadable: boolean;
  currency?: string;
  ownerName?: string;
  rejectionReason?: string;
  copropertyId?: string;
  copropertyName?: string;
}

@Component({
  selector: 'app-owner-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="container-fluid py-4">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col-md-8">
          <h2 class="mb-1">
            <i class="bi bi-receipt me-2"></i>
            {{ 'ownerPortal.receipts.title' | translate }}
          </h2>
          <p class="text-muted">{{ 'ownerPortal.receipts.subtitle' | translate }}</p>
        </div>
        <div class="col-md-4 text-end">
          <button class="btn btn-outline-primary" (click)="downloadAll()">
            <i class="bi bi-download me-2"></i>
            {{ 'ownerPortal.receipts.downloadAll' | translate }}
          </button>
        </div>
      </div>

      <div class="mb-3">
        <label for="receipt-coproperty" class="form-label">{{ 'ownerPortal.receipts.coproperty' | translate }}</label>
        <select id="receipt-coproperty" class="form-select" [(ngModel)]="selectedCopropertyId" (ngModelChange)="filterInvoices()">
          <option value="">{{ 'ownerPortal.receipts.selectCoproperty' | translate }}</option>
          <option *ngFor="let coproperty of coproperties()" [value]="coproperty.id">{{ coproperty.name }}</option>
        </select>
      </div>
      <div *ngIf="!selectedCopropertyId" class="alert alert-info d-flex align-items-center gap-2" role="status">
        <i class="bi bi-info-circle-fill" aria-hidden="true"></i>
        <span>{{ 'requestedFixes.selectCopropertyPrompt' | translate }}</span>
      </div>
      <!-- Statistics -->
      <div class="row mb-4">
        <div class="col-md-4">
          <div class="stat-card">
            <div class="stat-icon bg-success">
              <i class="bi bi-receipt-cutoff"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().total }}</div>
              <div class="stat-label">{{ 'ownerPortal.receipts.total' | translate }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="stat-card">
            <div class="stat-icon bg-primary">
              <i class="bi bi-cash-stack"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ totalPaidDisplay() }}</div>
              <div class="stat-label">{{ 'ownerPortal.receipts.totalPaid' | translate }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="stat-card">
            <div class="stat-icon bg-secondary">
              <i class="bi bi-calendar-check"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().lastPaymentDate }}</div>
              <div class="stat-label">{{ 'ownerPortal.receipts.lastPayment' | translate }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="row mb-4">
        <div class="col-md-3">
          <select class="form-select" [(ngModel)]="selectedYear" (change)="filterInvoices()">
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
      </div>

      <!-- Invoices List -->
      <div class="row" *ngIf="selectedCopropertyId">
        <div class="col-12">
          <div class="table-responsive">
            <table class="table invoice-table">
              <thead>
                <tr>
                  <th>{{ 'ownerPortal.receipts.receipt' | translate }}</th>
                  <th>{{ 'ownerPortal.receipts.description' | translate }}</th>
                  <th>{{ 'ownerPortal.receipts.unit' | translate }}</th>
                  <th>{{ 'ownerPortal.receipts.date' | translate }}</th>
                  <th>{{ 'ownerPortal.receipts.amount' | translate }}</th>
                  <th>{{ 'ownerPortal.receipts.method' | translate }}</th>
                  <th>{{ 'ownerPortal.receipts.status' | translate }}</th>
                  <th>{{ 'ownerPortal.receipts.actions' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let invoice of filteredInvoices()">
                  <td>
                    <strong>{{ invoice.number }}</strong>
                  </td>
                  <td>
                    <span>{{ invoice.description }}</span>
                    <br>
                    <small class="text-muted">{{ invoice.period }}</small>
                  </td>
                  <td><span class="badge bg-secondary">{{ invoice.unitNumber }}</span></td>
                  <td>{{ invoice.paymentDate | date:'dd/MM/yyyy' }}</td>
                  <td class="fw-bold">{{ formatAmount(invoice.amount, invoice.currency) }}</td>
                  <td>
                    <span class="badge bg-light text-dark">
                      <i class="bi" [class.bi-credit-card]="invoice.paymentMethod === 'Card'" [class.bi-bank]="invoice.paymentMethod === 'BankTransfer'" [class.bi-cash]="invoice.paymentMethod !== 'Card' && invoice.paymentMethod !== 'BankTransfer'"></i>
                      {{ getPaymentMethodLabel(invoice.paymentMethod) }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="invoice.status === 'paid' ? 'bg-success' : invoice.status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'">
                      <i class="bi me-1" [ngClass]="invoice.status === 'paid' ? 'bi-check-circle' : invoice.status === 'rejected' ? 'bi-x-circle' : 'bi-clock'"></i>
                      {{ ('ownerPortal.receipts.statuses.' + invoice.status) | translate }}
                    </span>
                    <div *ngIf="invoice.status === 'rejected' && invoice.rejectionReason" class="small text-danger mt-1">
                      <strong>{{ 'ownerPortal.receipts.rejectionReason' | translate }}:</strong> {{ invoice.rejectionReason }}
                    </div>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button class="btn btn-sm btn-outline-primary me-1" (click)="viewInvoice(invoice.id)" [title]="'ownerPortal.receipts.view' | translate">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button *ngIf="invoice.downloadable" class="btn btn-sm btn-outline-secondary"
                              (click)="downloadInvoice(invoice.id)" [title]="'ownerPortal.receipts.download' | translate">
                        <i class="bi bi-download"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Invoice Preview Modal ── -->
    <div *ngIf="showInvoiceModal()" class="invoice-modal-backdrop" (click)="closeInvoiceModal()"></div>

    <div class="invoice-modal" [class.invoice-modal--open]="showInvoiceModal()">
      <div class="invoice-modal-header">
        <h5 class="mb-0">
          <i class="bi bi-file-earmark-text me-2"></i>
          {{ 'ownerPortal.receipts.detail' | translate }}
        </h5>
        <button type="button" class="btn-close" (click)="closeInvoiceModal()"></button>
      </div>

      <div class="invoice-modal-body" *ngIf="selectedInvoice()">
        <div class="invoice-document">

          <!-- Header -->
          <div class="inv-header">
            <div class="inv-brand">
              <div class="inv-logo">
                <i class="bi bi-buildings"></i>
              </div>
              <div>
                <div class="inv-company">MYB Syndic</div>
                <div class="text-muted small">{{ 'ownerPortal.receipts.copropertyManagement' | translate }}</div>
              </div>
            </div>
            <div class="inv-meta">
              <h4 class="inv-title">{{ 'ownerPortal.receipts.paymentReceipt' | translate }}</h4>
              <div class="inv-num"># {{ selectedInvoice()!.number }}</div>
              <span class="badge" [ngClass]="selectedInvoice()!.status === 'paid' ? 'bg-success' : selectedInvoice()!.status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'">
                {{ ('ownerPortal.receipts.statuses.' + selectedInvoice()!.status) | translate }}
              </span>
            </div>
          </div>

          <hr class="inv-divider">

          <div *ngIf="selectedInvoice()!.status === 'rejected' && selectedInvoice()!.rejectionReason" class="alert alert-danger">
            <strong>{{ 'ownerPortal.receipts.rejectionReason' | translate }}:</strong> {{ selectedInvoice()!.rejectionReason }}
          </div>

          <!-- Dates row -->
          <div class="inv-dates">
            <div class="inv-date-item">
              <span class="inv-date-label">{{ 'ownerPortal.receipts.issueDate' | translate }}</span>
              <span class="inv-date-value">{{ selectedInvoice()!.date | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="inv-date-item" *ngIf="selectedInvoice()!.paymentDate">
              <span class="inv-date-label">{{ 'ownerPortal.receipts.paymentDate' | translate }}</span>
              <span class="inv-date-value">{{ selectedInvoice()!.paymentDate | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="inv-date-item">
              <span class="inv-date-label">{{ 'ownerPortal.receipts.unit' | translate }}</span>
              <span class="inv-date-value">{{ selectedInvoice()!.unitNumber }}</span>
            </div>
            <div class="inv-date-item">
              <span class="inv-date-label">{{ 'ownerPortal.receipts.period' | translate }}</span>
              <span class="inv-date-value">{{ selectedInvoice()!.period }}</span>
            </div>
          </div>

          <hr class="inv-divider">

          <!-- Copropriétaire -->
          <div class="inv-dates" style="margin-bottom: 0.5rem;">
            <div class="inv-date-item">
              <span class="inv-date-label">{{ 'ownerPortal.receipts.owner' | translate }}</span>
              <span class="inv-date-value">{{ selectedInvoice()!.ownerName || ownerName() }}</span>
            </div>
            <div class="inv-date-item" *ngIf="selectedInvoice()!.paymentMethod">
              <span class="inv-date-label">{{ 'ownerPortal.receipts.paymentMethod' | translate }}</span>
              <span class="inv-date-value">{{ getPaymentMethodLabel(selectedInvoice()!.paymentMethod) }}</span>
            </div>
          </div>

          <hr class="inv-divider">

          <!-- Line items table -->
          <table class="inv-table">
            <thead>
              <tr>
                <th>{{ 'ownerPortal.receipts.description' | translate }}</th>
                <th class="text-center">{{ 'ownerPortal.receipts.quantity' | translate }}</th>
                <th class="text-end">{{ 'ownerPortal.receipts.unitPrice' | translate }}</th>
                <th class="text-end">{{ 'ownerPortal.receipts.subtotal' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ selectedInvoice()!.description }}</td>
                <td class="text-center">1</td>
                <td class="text-end">{{ formatAmount(selectedInvoice()!.amount, selectedInvoice()!.currency) }}</td>
                <td class="text-end"><strong>{{ formatAmount(selectedInvoice()!.amount, selectedInvoice()!.currency) }}</strong></td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="inv-subtotal">
                <td colspan="3" class="text-end">{{ 'ownerPortal.receipts.subtotal' | translate }}</td>
                <td class="text-end">{{ formatAmount(selectedInvoice()!.amount, selectedInvoice()!.currency) }}</td>
              </tr>
              <tr class="inv-total">
                <td colspan="3" class="text-end"><strong>{{ 'ownerPortal.receipts.totalIncludingTax' | translate }}</strong></td>
                <td class="text-end"><strong>{{ formatAmount(selectedInvoice()!.amount, selectedInvoice()!.currency) }}</strong></td>
              </tr>
            </tfoot>
          </table>

          <!-- Footer note -->
          <div class="inv-footer-note">
            <i class="bi bi-info-circle me-1"></i>
            {{ 'ownerPortal.receipts.generatedBy' | translate }}
          </div>
        </div>
      </div>

      <!-- Action bar -->
      <div class="invoice-modal-footer" *ngIf="selectedInvoice()">
        <button type="button" class="btn btn-secondary" (click)="closeInvoiceModal()">
          <i class="bi bi-x-circle me-1"></i>{{ 'ownerPortal.receipts.close' | translate }}
        </button>
        <button *ngIf="selectedInvoice()!.downloadable" type="button" class="btn btn-primary"
                (click)="downloadInvoice(selectedInvoice()!.id)">
          <i class="bi bi-download me-1"></i>{{ 'ownerPortal.receipts.downloadPdf' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      gap: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      height: 100%;
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: white;
      flex-shrink: 0;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 14px;
      color: #6c757d;
    }

    .invoice-table {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .invoice-table thead {
      background: #f8f9fa;
    }

    .invoice-table th {
      font-weight: 600;
      padding: 16px;
      border-bottom: 2px solid #dee2e6;
    }

    .invoice-table td {
      padding: 16px;
      vertical-align: middle;
    }

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* ── Invoice Preview Modal ── */
    .invoice-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      z-index: 1050;
      animation: fadeIn 0.2s ease;
    }

    .invoice-modal {
      position: fixed;
      top: 0;
      right: -680px;
      width: 660px;
      max-width: 100vw;
      height: 100vh;
      background: #fff;
      z-index: 1051;
      display: flex;
      flex-direction: column;
      box-shadow: -6px 0 30px rgba(0, 0, 0, 0.18);
      transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .invoice-modal--open {
      right: 0;
    }

    .invoice-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
      flex-shrink: 0;
    }

    .invoice-modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }

    .invoice-modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
      flex-shrink: 0;
    }

    /* ── Invoice Document Layout ── */
    .invoice-document {
      font-size: 0.9rem;
      color: #1f2937;
    }

    .inv-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }

    .inv-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .inv-logo {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: #fff;
    }

    .inv-company {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1e3a8a;
    }

    .inv-meta {
      text-align: right;
    }

    .inv-title {
      font-size: 1.6rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #1e3a8a;
      margin: 0 0 0.25rem;
    }

    .inv-num {
      font-size: 1rem;
      color: #6b7280;
      font-weight: 600;
      margin-bottom: 0.35rem;
    }

    .inv-divider {
      border-color: #e5e7eb;
      margin: 0.75rem 0;
    }

    .inv-dates {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .inv-date-item {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .inv-date-label {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #9ca3af;
      font-weight: 600;
    }

    .inv-date-value {
      font-weight: 600;
      color: #111827;
    }

    .inv-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0.75rem;
    }

    .inv-table th {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #6b7280;
      border-bottom: 2px solid #e5e7eb;
      padding: 0.5rem 0.75rem;
      font-weight: 600;
    }

    .inv-table td {
      padding: 0.65rem 0.75rem;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: top;
    }

    .inv-subtotal td {
      border-top: 2px solid #e5e7eb;
      border-bottom: none;
      color: #6b7280;
      padding-top: 0.75rem;
    }

    .inv-total td {
      font-size: 1rem;
      border-top: 2px solid #1e3a8a;
      border-bottom: none;
      color: #1e3a8a;
      padding-top: 0.75rem;
    }

    .inv-footer-note {
      margin-top: 1.5rem;
      padding: 0.75rem 1rem;
      background: #eff6ff;
      border-left: 3px solid #3b82f6;
      border-radius: 0 0.375rem 0.375rem 0;
      font-size: 0.82rem;
      color: #4b5563;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    @media (max-width: 992px) {
      .stat-card { padding: 16px; }
      .stat-icon { width: 44px; height: 44px; font-size: 20px; }
      .stat-value { font-size: 22px; }
      .invoice-modal { width: 480px; right: -480px; }
      .invoice-modal--open { right: 0; }
    }

    @media (max-width: 576px) {
      .stat-card { padding: 14px; gap: 12px; }
      .stat-icon { width: 40px; height: 40px; font-size: 18px; }
      .stat-value { font-size: 20px; }
      .stat-label { font-size: 12px; }

      .invoice-table th { padding: 10px 8px; font-size: 13px; }
      .invoice-table td { padding: 10px 8px; font-size: 13px; }
      .action-buttons { flex-direction: column; gap: 4px; }

      .invoice-modal {
        width: 100vw;
        right: -100vw;
      }
      .invoice-modal--open { right: 0; }

      .invoice-modal-header { padding: 0.875rem 1rem; }
      .invoice-modal-body { padding: 1rem; }
      .invoice-modal-footer {
        padding: 0.75rem 1rem;
        flex-direction: column;
        gap: 0.5rem;
      }
      .invoice-modal-footer .btn { width: 100%; }

      .inv-header { flex-direction: column; gap: 0.75rem; }
      .inv-meta { text-align: left; }
      .inv-title { font-size: 1.2rem; }
      .inv-dates { grid-template-columns: 1fr 1fr; gap: 0.5rem; }
    }
  `]
})
export class OwnerInvoicesComponent implements OnInit {
  selectedCopropertyId = '';
  coproperties = computed(() => Array.from(new Map(this.invoices()
    .filter(i => !!i.copropertyId)
    .map(i => [i.copropertyId!, { id: i.copropertyId!, name: i.copropertyName || i.copropertyId! }])).values()));
  selectedYear = new Date().getFullYear().toString();

  invoices = signal<Invoice[]>([]);
  filteredInvoices = signal<Invoice[]>(this.invoices());
  showInvoiceModal = signal(false);
  selectedInvoice = signal<Invoice | null>(null);
  ownerName = signal<string>('');

  stats = computed(() => {
    const invoices = this.filteredInvoices();
    const total = invoices.length;
    const lastPayment = invoices
      .filter(i => i.paymentDate && i.status === 'paid')
      .sort((a, b) => (b.paymentDate?.getTime() ?? 0) - (a.paymentDate?.getTime() ?? 0))[0];
    const lastPaymentDate = lastPayment?.paymentDate
      ? lastPayment.paymentDate.toLocaleDateString('fr-FR') : '—';

    return { total, lastPaymentDate };
  });

  /** Never add monetary values expressed in different currencies. */
  totalPaidDisplay = computed(() => {
    if (!this.filteredInvoices().length) return '—';
    const totals = new Map<string, number>();
    for (const invoice of this.filteredInvoices().filter(item => item.status === 'paid')) {
      const currency = invoice.currency ?? this.currencyService.current;
      totals.set(currency, (totals.get(currency) ?? 0) + invoice.amount);
    }
    if (totals.size === 0) return this.currencyService.formatAmount(0, this.filteredInvoices()[0]?.currency);
    return Array.from(totals.entries())
      .map(([currency, amount]) => this.currencyService.formatAmount(amount, currency))
      .join(' · ');
  });

  private ownerService = inject(OwnerService);
  private fundCallService = inject(FundCallService);
  private keycloakService = inject(KeycloakService);
  private currencyService = inject(CurrencyService);
  private translate = inject(TranslateService);
  private notificationService = inject(NotificationService);
  private destroyRef = inject(DestroyRef);
  private unitsById = new Map<string, Unit>();

  ngOnInit(): void {
    this.loadReceipts();
    this.notificationService.dataChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadReceipts());
  }

  private loadReceipts(): void {
    const userId = this.getCurrentUserId();

    // Get owner name from Keycloak profile
    const profile = this.keycloakService.getProfile();
    if (profile) {
      this.ownerName.set(`${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim());
    }

    if (!userId) {
      // If user ID is not available, do not attempt to load data
      console.error('OwnerInvoicesComponent: user ID not available');
      return;
    }

    // Load owner data first to get owner ID, then load all receipts
    this.ownerService.getOwnerByUserId(userId).pipe(
      take(1),
      catchError(() => of(null)),
      switchMap((owner) => {
        const ownerId = owner?.id;
        return forkJoin({
          units: this.ownerService.getMyUnits(userId).pipe(take(1), catchError(() => of([] as Unit[]))),
          invoices: this.ownerService.getMyInvoices(userId).pipe(take(1), catchError(() => of([] as CopropertyInvoice[]))),
          distributions: ownerId
            ? this.ownerService.getOwnerChargeDistributions(ownerId).pipe(take(1), catchError(() => of([] as ChargeDistribution[])))
            : of([] as ChargeDistribution[]),
          fundCallPayments: this.fundCallService.getFundCallPaymentsByOwner(userId)
            .pipe(take(1), catchError(() => of([] as FundCallPaymentWithContext[]))),
        });
      })
    ).subscribe({
      next: ({ units, invoices, distributions, fundCallPayments }) => {
        // Store units for mapping
        units.forEach((unit) => this.unitsById.set(unit.id, unit));

        // Map invoices (only PAID ones for receipts)
        const paidInvoices = invoices.filter(inv => this.isPaidInvoiceStatus(inv.status));
        const mappedInvoices = paidInvoices.map((inv) => this.mapInvoice(inv));

        // Map charge distributions (only PAID ones for receipts)
        const paidDistributions = distributions.filter(
          d => d.paymentStatus === 'PAID' || d.paymentStatus === 'Paid'
        );
        const mappedDistributions = paidDistributions.map((dist) => this.mapChargeDistribution(dist));

        // Keep pending, approved, and rejected proofs for a complete audit trail.
        const mappedFundCallPayments = fundCallPayments.map(payment => this.mapFundCallPayment(payment));

        // Merge and sort by date (descending)
        const allReceipts = [...mappedInvoices, ...mappedDistributions, ...mappedFundCallPayments]
          .sort((a, b) => {
            const dateA = a.paymentDate ?? a.date;
            const dateB = b.paymentDate ?? b.date;
            return dateB.getTime() - dateA.getTime();
          });

        this.invoices.set(allReceipts);
        if (!this.coproperties().some(c => c.id === this.selectedCopropertyId)) {
          this.selectedCopropertyId = this.coproperties()[0]?.id ?? '';
        }
        this.filterInvoices();
      },
      error: (error) => {
        console.error('Error loading owner receipts:', error);
      }
    });
  }

  filterInvoices() {
    let filtered = this.invoices().filter(i => !!this.selectedCopropertyId && i.copropertyId === this.selectedCopropertyId);
    this.closeInvoiceModal();

    if (this.selectedYear) {
      filtered = filtered.filter(i => {
        const d = i.paymentDate ?? i.date;
        return d.getFullYear().toString() === this.selectedYear;
      });
    }

    this.filteredInvoices.set(filtered);
  }

  getPaymentMethodLabel(method: string): string {
    const keys: Record<string, string> = {
      Card: 'ownerPortal.receipts.paymentMethods.card',
      BankTransfer: 'ownerPortal.receipts.paymentMethods.bankTransfer',
      Cash: 'ownerPortal.receipts.paymentMethods.cash',
      Check: 'ownerPortal.receipts.paymentMethods.check'
    };
    return keys[method] ? this.translate.instant(keys[method]) : method || '—';
  }

  formatAmount(amount: number | string | undefined | null, currency?: string): string {
    return this.currencyService.formatAmount(amount, currency);
  }

  private modalService = inject(ModalService);
  private fileService = inject(FileDownloadService);
  private toastService = inject(ToastService);

  private getCurrentUserId(): string | null {
    return this.keycloakService.getUserId()
      ?? this.keycloakService.getProfile()?.id
      ?? null;
  }

  private mapInvoice(inv: CopropertyInvoice): Invoice {
    const date = new Date(inv.invoiceDate);
    const unit = this.unitsById.get(inv.unitId);

    return {
      copropertyId: inv.copropertyId ?? unit?.copropertyId,
      copropertyName: inv.copropertyNameSnapshot,
      id: inv.id,
      number: inv.invoiceNumber,
      description: inv.description ?? '',
      date,
      amount: inv.totalAmount,
      period: this.getPeriodLabel(date),
      unitNumber: inv.unitNumberSnapshot ?? unit?.unitNumber ?? this.extractUnitNumber(inv.description) ?? '—',
      paymentDate: inv.paidDate ? new Date(inv.paidDate) : undefined,
      paymentMethod: inv.paymentMethod ?? '',
      status: this.isPaidInvoiceStatus(inv.status) ? 'paid' : 'pending',
      downloadable: true,
      currency: inv.currency,
      ownerName: inv.ownerNameSnapshot,
    };
  }

  private mapChargeDistribution(dist: ChargeDistribution): Invoice {
    const date = new Date(dist.calculatedAt);
    const unit = this.unitsById.get(dist.unitId);
    const paymentDate = dist.paidAt ? new Date(dist.paidAt) : date;

    return {
      copropertyId: dist.copropertyId ?? unit?.copropertyId,
      copropertyName: dist.copropertyName,
      id: dist.id,
      number: dist.id.substring(0, 8).toUpperCase(),
      description: dist.chargeName || 'Appel de fonds',
      date,
      amount: dist.amount,
      period: this.getPeriodLabel(paymentDate),
      unitNumber: dist.unitNumber ?? unit?.unitNumber ?? this.extractUnitNumber(dist.chargeName) ?? '—',
      paymentDate,
      paymentMethod: dist.paymentMethod ?? 'Virement',
      status: 'paid',
      downloadable: true,
      currency: dist.currency,
    };
  }

  private mapFundCallPayment(payment: FundCallPaymentWithContext): Invoice {
    const paymentDate = new Date(payment.paymentDate);
    return {
      copropertyId: payment.fundCall?.coproperty?.id,
      copropertyName: payment.fundCall?.coproperty?.name,
      id: payment.id,
      number: `FC-${payment.id.substring(0, 8).toUpperCase()}`,
      description: payment.fundCall?.description || 'Appel de fonds',
      date: paymentDate,
      amount: payment.amount,
      period: this.getPeriodLabel(paymentDate),
      unitNumber: payment.unitNumberSnapshot ?? this.extractUnitNumber(payment.fundCall?.description) ?? '—',
      paymentDate,
      paymentMethod: payment.paymentMethod ?? '',
      status: this.isPaymentApproved(payment.validationStatus)
        ? 'paid'
        : this.isPaymentRejected(payment.validationStatus) ? 'rejected' : 'pending',
      downloadable: this.isPaymentApproved(payment.validationStatus),
      currency: payment.fundCall?.currency,
      ownerName: payment.fundCall?.ownerName,
      rejectionReason: payment.rejectionReason,
    };
  }

  /** Compatibility fallback for receipts created before unit snapshots existed. */
  private extractUnitNumber(description: string | null | undefined): string | undefined {
    return description?.match(/\bLot\s+([^),;]+)/i)?.[1]?.trim() || undefined;
  }

  /** GraphQL serializes .NET enum values as SCREAMING_SNAKE_CASE. */
  private isPaidInvoiceStatus(status: InvoiceStatus | string | null | undefined): boolean {
    return String(status ?? '').replace(/_/g, '').toUpperCase() === 'PAID';
  }

  /** Accepts Approved/APPROVED/approved and underscore variants. */
  private isPaymentApproved(status: string | null | undefined): boolean {
    return String(status ?? '').replace(/[_\s-]/g, '').toUpperCase() === 'APPROVED';
  }

  private isPaymentRejected(status: string | null | undefined): boolean {
    return String(status ?? '').replace(/[_\s-]/g, '').toUpperCase() === 'REJECTED';
  }

  private mapStatus(status: InvoiceStatus): 'paid' | 'pending' | 'overdue' {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'paid';
      case InvoiceStatus.OVERDUE:
        return 'overdue';
      case InvoiceStatus.PARTIALLY_PAID:
      case InvoiceStatus.PENDING:
      case InvoiceStatus.CANCELLED:
      default:
        return 'pending';
    }
  }

  private getPeriodLabel(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-based
    const quarter = Math.floor(month / 3) + 1;
    return `T${quarter} ${year}`;
  }

  viewInvoice(id: string): void {
    const invoice = this.invoices().find(inv => inv.id === id);
    if (!invoice) return;
    this.selectedInvoice.set(invoice);
    this.showInvoiceModal.set(true);
  }

  closeInvoiceModal(): void {
    this.showInvoiceModal.set(false);
    this.selectedInvoice.set(null);
  }

  downloadInvoice(id: string): void {
    const invoice = this.invoices().find(inv => inv.id === id);
    if (!invoice || !invoice.downloadable) return;

    const fmt = (v: number) => this.currencyService.formatAmount(v, invoice.currency);
    const fmtD = (d: Date | undefined) => d ? d.toLocaleDateString('fr-FR') : '-';
    const owner = invoice.ownerName || this.ownerName() || '—';

    const statusBadge = invoice.status === 'paid'
      ? '<span class="badge badge-success">Payée</span>'
      : '<span class="badge badge-draft">En attente</span>';

    const metaRows = [
      { label: 'Date de facture', value: fmtD(invoice.date) },
      invoice.paymentDate ? { label: 'Date de paiement', value: fmtD(invoice.paymentDate) } : null,
      { label: 'Lot', value: invoice.unitNumber },
      { label: 'Période', value: invoice.period },
      { label: 'Copropriétaire', value: owner },
      invoice.paymentMethod ? { label: 'Méthode de paiement', value: this.getPaymentMethodLabel(invoice.paymentMethod) } : null,
    ].filter(Boolean).map(m => `
      <div class="meta-item">
        <span class="meta-label">${m!.label}</span>
        <span class="meta-value">${m!.value}</span>
      </div>`).join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Facture ${invoice.number}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1f2937; background: #fff; padding: 40px 48px; }
    .inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .inv-brand  { display: flex; align-items: center; gap: 14px; }
    .inv-logo   { width: 52px; height: 52px; background: linear-gradient(135deg,#3b82f6,#1d4ed8); border-radius: 10px;
                  display: flex; align-items: center; justify-content: center; }
    .inv-logo svg { width: 28px; height: 28px; fill: #fff; }
    .inv-company { font-size: 16px; font-weight: 700; color: #1e3a8a; }
    .inv-tagline { font-size: 11px; color: #9ca3af; margin-top: 2px; }
    .inv-meta   { text-align: right; }
    .inv-title  { font-size: 28px; font-weight: 800; letter-spacing: .05em; color: #1e3a8a; line-height: 1; }
    .inv-num    { font-size: 13px; color: #6b7280; font-weight: 600; margin: 6px 0; }
    .badge      { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-draft   { background: #fef9c3; color: #854d0e; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
    .meta-grid { display: flex; flex-wrap: wrap; gap: 20px 32px; margin-bottom: 8px; }
    .meta-item { display: flex; flex-direction: column; gap: 2px; }
    .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #9ca3af; font-weight: 600; }
    .meta-value { font-size: 13px; font-weight: 600; color: #111827; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    thead tr th { font-size: 10.5px; text-transform: uppercase; letter-spacing: .04em; color: #6b7280;
                  border-bottom: 2px solid #e5e7eb; padding: 8px 10px; font-weight: 600; }
    tbody tr td { padding: 10px 10px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    tfoot .subtotal td { border-top: 2px solid #e5e7eb; color: #6b7280; padding: 10px 10px; }
    tfoot .total   td { border-top: 2px solid #1e3a8a; color: #1e3a8a; font-size: 15px; padding: 10px 10px; }
    .right  { text-align: right; }
    .center { text-align: center; }
    .inv-note { margin-top: 28px; padding: 10px 14px; background: #eff6ff;
                border-left: 3px solid #3b82f6; border-radius: 0 6px 6px 0; font-size: 11.5px; color: #4b5563; }
    @page { margin: 10mm 12mm; }
  </style>
</head>
<body>
  <div class="inv-header">
    <div class="inv-brand">
      <div class="inv-logo">
        <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </div>
      <div>
        <div class="inv-company">MYB Syndic</div>
        <div class="inv-tagline">Gestion de copropriété</div>
      </div>
    </div>
    <div class="inv-meta">
      <div class="inv-title">FACTURE</div>
      <div class="inv-num"># ${invoice.number}</div>
      ${statusBadge}
    </div>
  </div>

  <hr>

  <div class="meta-grid">${metaRows}</div>

  <hr>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="center">Qté</th>
        <th class="right">Prix unit.</th>
        <th class="right">Total HT</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${invoice.description}</td>
        <td class="center">1</td>
        <td class="right">${fmt(invoice.amount)}</td>
        <td class="right"><strong>${fmt(invoice.amount)}</strong></td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="subtotal">
        <td colspan="3" class="right">Sous-total HT</td>
        <td class="right">${fmt(invoice.amount)}</td>
      </tr>
      <tr class="total">
        <td colspan="3" class="right"><strong>TOTAL TTC</strong></td>
        <td class="right"><strong>${fmt(invoice.amount)}</strong></td>
      </tr>
    </tfoot>
  </table>

  <div class="inv-note">ⓘ Reçu de paiement généré par MYB Syndic</div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }

  downloadAll(): void {
    const invoices = this.filteredInvoices().filter(invoice => invoice.downloadable);
    if (invoices.length === 0) {
      this.toastService.show(
        'Aucune facture à télécharger',
        { classname: 'toast-warning' }
      );
      return;
    }

    this.toastService.show(
      `${invoices.length} facture(s) en cours de téléchargement`,
      { classname: 'toast-success' }
    );
  }
}
