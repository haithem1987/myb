import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService, FileDownloadService, ToastService } from '@myb-front/shared-ui';
import { OwnerService, CopropertyInvoice, InvoiceStatus, Unit, CurrencyService, ChargeDistribution, FundCallService } from '../../../index';
import { FundCallPaymentWithContext } from '../../../models/fund-call.model';
import { KeycloakService } from '@myb-front/auth';
import { forkJoin, of } from 'rxjs';
import { catchError, take, switchMap } from 'rxjs/operators';

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
  currency?: string;
}

@Component({
  selector: 'app-owner-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid py-4">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col-md-8">
          <h2 class="mb-1">
            <i class="bi bi-receipt me-2"></i>
            Mes Reçus
          </h2>
          <p class="text-muted">Historique de vos paiements et reçus de charges</p>
        </div>
        <div class="col-md-4 text-end">
          <button class="btn btn-outline-primary" (click)="downloadAll()">
            <i class="bi bi-download me-2"></i>
            Télécharger tout
          </button>
        </div>
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
              <div class="stat-label">Total reçus</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="stat-card">
            <div class="stat-icon bg-primary">
              <i class="bi bi-cash-stack"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ formatAmount(stats().totalPaid) }}</div>
              <div class="stat-label">Total payé</div>
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
              <div class="stat-label">Dernier paiement</div>
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
      <div class="row">
        <div class="col-12">
          <div class="table-responsive">
            <table class="table invoice-table">
              <thead>
                <tr>
                  <th>Reçu</th>
                  <th>Description</th>
                  <th>Lot</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Méthode</th>
                  <th>Actions</th>
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
                    <div class="action-buttons">
                      <button class="btn btn-sm btn-outline-primary me-1" (click)="viewInvoice(invoice.id)" title="Voir">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-secondary" (click)="downloadInvoice(invoice.id)" title="Télécharger">
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
          Détail du reçu
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
                <div class="text-muted small">Gestion de copropriété</div>
              </div>
            </div>
            <div class="inv-meta">
              <h4 class="inv-title">REÇU DE PAIEMENT</h4>
              <div class="inv-num"># {{ selectedInvoice()!.number }}</div>
              <span class="badge" [ngClass]="selectedInvoice()!.status === 'paid' ? 'bg-success' : 'bg-warning text-dark'">
                {{ selectedInvoice()!.status === 'paid' ? 'Payée' : 'En attente' }}
              </span>
            </div>
          </div>

          <hr class="inv-divider">

          <!-- Dates row -->
          <div class="inv-dates">
            <div class="inv-date-item">
              <span class="inv-date-label">Date d'émission</span>
              <span class="inv-date-value">{{ selectedInvoice()!.date | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="inv-date-item" *ngIf="selectedInvoice()!.paymentDate">
              <span class="inv-date-label">Date de paiement</span>
              <span class="inv-date-value">{{ selectedInvoice()!.paymentDate | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="inv-date-item">
              <span class="inv-date-label">Lot</span>
              <span class="inv-date-value">{{ selectedInvoice()!.unitNumber }}</span>
            </div>
            <div class="inv-date-item">
              <span class="inv-date-label">Période</span>
              <span class="inv-date-value">{{ selectedInvoice()!.period }}</span>
            </div>
          </div>

          <hr class="inv-divider">

          <!-- Copropriétaire -->
          <div class="inv-dates" style="margin-bottom: 0.5rem;">
            <div class="inv-date-item">
              <span class="inv-date-label">Copropriétaire</span>
              <span class="inv-date-value">{{ ownerName() }}</span>
            </div>
            <div class="inv-date-item" *ngIf="selectedInvoice()!.paymentMethod">
              <span class="inv-date-label">Méthode de paiement</span>
              <span class="inv-date-value">{{ getPaymentMethodLabel(selectedInvoice()!.paymentMethod) }}</span>
            </div>
          </div>

          <hr class="inv-divider">

          <!-- Line items table -->
          <table class="inv-table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-center">Qté</th>
                <th class="text-end">Prix unit.</th>
                <th class="text-end">Total HT</th>
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
                <td colspan="3" class="text-end">Sous-total HT</td>
                <td class="text-end">{{ formatAmount(selectedInvoice()!.amount, selectedInvoice()!.currency) }}</td>
              </tr>
              <tr class="inv-total">
                <td colspan="3" class="text-end"><strong>TOTAL TTC</strong></td>
                <td class="text-end"><strong>{{ formatAmount(selectedInvoice()!.amount, selectedInvoice()!.currency) }}</strong></td>
              </tr>
            </tfoot>
          </table>

          <!-- Footer note -->
          <div class="inv-footer-note">
            <i class="bi bi-info-circle me-1"></i>
            Reçu de paiement généré par MYB Syndic
          </div>
        </div>
      </div>

      <!-- Action bar -->
      <div class="invoice-modal-footer" *ngIf="selectedInvoice()">
        <button type="button" class="btn btn-secondary" (click)="closeInvoiceModal()">
          <i class="bi bi-x-circle me-1"></i>Fermer
        </button>
        <button type="button" class="btn btn-primary" (click)="downloadInvoice(selectedInvoice()!.id)">
          <i class="bi bi-download me-1"></i>Télécharger PDF
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
  selectedYear = new Date().getFullYear().toString();

  invoices = signal<Invoice[]>([]);
  filteredInvoices = signal<Invoice[]>(this.invoices());
  showInvoiceModal = signal(false);
  selectedInvoice = signal<Invoice | null>(null);
  ownerName = signal<string>('');

  stats = computed(() => {
    const invoices = this.filteredInvoices();
    const total = invoices.length;
    const totalPaid = invoices.reduce((sum, i) => sum + i.amount, 0);
    const lastPayment = invoices
      .filter(i => i.paymentDate)
      .sort((a, b) => (b.paymentDate?.getTime() ?? 0) - (a.paymentDate?.getTime() ?? 0))[0];
    const lastPaymentDate = lastPayment?.paymentDate
      ? lastPayment.paymentDate.toLocaleDateString('fr-FR') : '—';

    return { total, totalPaid, lastPaymentDate };
  });

  private ownerService = inject(OwnerService);
  private fundCallService = inject(FundCallService);
  private keycloakService = inject(KeycloakService);
  private currencyService = inject(CurrencyService);
  private unitsById = new Map<string, Unit>();

  ngOnInit(): void {
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

        // A validated fund-call payment is also a receipt. This source was
        // previously omitted, leaving "Mes Reçus" empty for owners who paid
        // through the call-for-funds workflow.
        const mappedFundCallPayments = fundCallPayments
          .filter((payment) => this.isPaymentApproved(payment.validationStatus))
          .map(payment => this.mapFundCallPayment(payment));

        // Merge and sort by date (descending)
        const allReceipts = [...mappedInvoices, ...mappedDistributions, ...mappedFundCallPayments]
          .sort((a, b) => {
            const dateA = a.paymentDate ?? a.date;
            const dateB = b.paymentDate ?? b.date;
            return dateB.getTime() - dateA.getTime();
          });

        this.invoices.set(allReceipts);
        this.filteredInvoices.set(allReceipts);
      },
      error: (error) => {
        console.error('Error loading owner receipts:', error);
      }
    });
  }

  filterInvoices() {
    let filtered = this.invoices();

    if (this.selectedYear) {
      filtered = filtered.filter(i => {
        const d = i.paymentDate ?? i.date;
        return d.getFullYear().toString() === this.selectedYear;
      });
    }

    this.filteredInvoices.set(filtered);
  }

  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      Card: 'Carte',
      BankTransfer: 'Virement',
      Cash: 'Espèces',
      Check: 'Chèque'
    };
    return labels[method] || method || '—';
  }

  formatAmount(amount: number | string | undefined | null, currency?: string): string {
    return this.currencyService.formatAmount(amount, currency);
  }

  private modalService = inject(ModalService);
  private fileService = inject(FileDownloadService);
  private toastService = inject(ToastService);

  private getCurrentUserId(): string | null {
    const token = this.keycloakService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || null;
      } catch (error) {
        console.error('Error parsing Keycloak token in OwnerInvoicesComponent:', error);
        return null;
      }
    }
    return null;
  }

  private mapInvoice(inv: CopropertyInvoice): Invoice {
    const date = new Date(inv.invoiceDate);
    const unit = this.unitsById.get(inv.unitId);

    return {
      id: inv.id,
      number: inv.invoiceNumber,
      description: inv.description ?? '',
      date,
      amount: inv.totalAmount,
      period: this.getPeriodLabel(date),
      unitNumber: inv.unitNumberSnapshot ?? unit?.unitNumber ?? '—',
      paymentDate: inv.paidDate ? new Date(inv.paidDate) : undefined,
      paymentMethod: inv.paymentMethod ?? '',
      status: this.isPaidInvoiceStatus(inv.status) ? 'paid' : 'pending',
      currency: inv.currency,
    };
  }

  private mapChargeDistribution(dist: ChargeDistribution): Invoice {
    const date = new Date(dist.calculatedAt);
    const unit = this.unitsById.get(dist.unitId);
    const paymentDate = dist.paidAt ? new Date(dist.paidAt) : date;

    return {
      id: dist.id,
      number: dist.id.substring(0, 8).toUpperCase(),
      description: dist.chargeName || 'Appel de fonds',
      date,
      amount: dist.amount,
      period: this.getPeriodLabel(paymentDate),
      unitNumber: unit?.unitNumber ?? '—',
      paymentDate,
      paymentMethod: dist.paymentMethod ?? 'Virement',
      status: 'paid',
      currency: dist.currency,
    };
  }

  private mapFundCallPayment(payment: FundCallPaymentWithContext): Invoice {
    const paymentDate = new Date(payment.paymentDate);
    return {
      id: payment.id,
      number: `FC-${payment.id.substring(0, 8).toUpperCase()}`,
      description: payment.fundCall?.description || 'Appel de fonds',
      date: paymentDate,
      amount: payment.amount,
      period: this.getPeriodLabel(paymentDate),
      unitNumber: '—',
      paymentDate,
      paymentMethod: payment.paymentMethod ?? '',
      status: 'paid',
      currency: payment.fundCall?.currency,
    };
  }

  /** GraphQL serializes .NET enum values as SCREAMING_SNAKE_CASE. */
  private isPaidInvoiceStatus(status: InvoiceStatus | string | null | undefined): boolean {
    return String(status ?? '').replace(/_/g, '').toUpperCase() === 'PAID';
  }

  /** Accepts Approved/APPROVED/approved and underscore variants. */
  private isPaymentApproved(status: string | null | undefined): boolean {
    return String(status ?? '').replace(/[_\s-]/g, '').toUpperCase() === 'APPROVED';
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
    if (!invoice) return;

    const fmt = (v: number) => this.currencyService.formatAmount(v, invoice.currency);
    const fmtD = (d: Date | undefined) => d ? d.toLocaleDateString('fr-FR') : '-';
    const owner = this.ownerName() || '—';

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
    const invoices = this.filteredInvoices();
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
