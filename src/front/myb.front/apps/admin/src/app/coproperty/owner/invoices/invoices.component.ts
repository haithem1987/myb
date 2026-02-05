import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService, FileDownloadService, ToastService } from '@myb-front/shared-ui';
import { OwnerService, CopropertyInvoice, InvoiceStatus, Unit } from '@myb-front/coproperty-module';
import { KeycloakService } from '@myb-front/auth';

interface Invoice {
  id: string;
  number: string;
  date: Date;
  dueDate: Date;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  period: string;
  unitNumber: string;
  copropertyName: string;
  paymentDate?: Date;
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
            Mes Factures
          </h2>
          <p class="text-muted">Consultez et payez vos factures de charges</p>
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
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon bg-danger">
              <i class="bi bi-exclamation-circle"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().pending }}</div>
              <div class="stat-label">À payer</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon bg-warning">
              <i class="bi bi-clock-history"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().overdue }}</div>
              <div class="stat-label">En retard</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon bg-success">
              <i class="bi bi-check-circle"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().paid }}</div>
              <div class="stat-label">Payées</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon bg-primary">
              <i class="bi bi-cash-stack"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().totalDue }} €</div>
              <div class="stat-label">Montant dû</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="row mb-4">
        <div class="col-md-3">
          <select class="form-select" [(ngModel)]="selectedStatus" (change)="filterInvoices()">
            <option value="all">Tous les statuts</option>
            <option value="pending">À payer</option>
            <option value="overdue">En retard</option>
            <option value="paid">Payées</option>
          </select>
        </div>
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
                  <th>Facture</th>
                  <th>Période</th>
                  <th>Lot</th>
                  <th>Date</th>
                  <th>Échéance</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let invoice of filteredInvoices()" 
                    [class.table-warning]="invoice.status === 'overdue'"
                    [class.table-success]="invoice.status === 'paid'">
                  <td>
                    <strong>{{ invoice.number }}</strong>
                    <br>
                    <small class="text-muted">{{ invoice.copropertyName }}</small>
                  </td>
                  <td>{{ invoice.period }}</td>
                  <td><span class="badge bg-secondary">{{ invoice.unitNumber }}</span></td>
                  <td>{{ invoice.date | date:'dd/MM/yyyy' }}</td>
                  <td>{{ invoice.dueDate | date:'dd/MM/yyyy' }}</td>
                  <td class="fw-bold">{{ invoice.amount }} €</td>
                  <td>
                    <span class="badge" 
                          [class.bg-danger]="invoice.status === 'pending'"
                          [class.bg-warning]="invoice.status === 'overdue'"
                          [class.bg-success]="invoice.status === 'paid'">
                      {{ getStatusLabel(invoice.status) }}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button class="btn btn-sm btn-outline-primary me-1" (click)="viewInvoice(invoice.id)" title="Voir">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-secondary me-1" (click)="downloadInvoice(invoice.id)" title="Télécharger">
                        <i class="bi bi-download"></i>
                      </button>
                      <button *ngIf="invoice.status !== 'paid'" 
                              class="btn btn-sm btn-success" 
                              (click)="payInvoice(invoice.id)"
                              title="Payer">
                        <i class="bi bi-credit-card me-1"></i>
                        Payer
                      </button>
                      <span *ngIf="invoice.status === 'paid'" class="text-muted">
                        <i class="bi bi-check-circle text-success"></i>
                        {{ invoice.paymentDate | date:'dd/MM/yy' }}
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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
  `]
})
export class OwnerInvoicesComponent implements OnInit {
  selectedStatus = 'all';
  selectedYear = '2026';

  invoices = signal<Invoice[]>([]);

  filteredInvoices = signal<Invoice[]>(this.invoices());

  stats = computed(() => {
    const invoices = this.filteredInvoices();
    const pending = invoices.filter(i => i.status === 'pending').length;
    const overdue = invoices.filter(i => i.status === 'overdue').length;
    const paid = invoices.filter(i => i.status === 'paid').length;
    const totalDue = invoices
      .filter(i => i.status === 'pending' || i.status === 'overdue')
      .reduce((sum, i) => sum + i.amount, 0);

    return { pending, overdue, paid, totalDue };
  });

  private ownerService = inject(OwnerService);
  private keycloakService = inject(KeycloakService);
  private unitsById = new Map<string, Unit>();

  ngOnInit(): void {
    const userId = this.getCurrentUserId();

    if (!userId) {
      // If user ID is not available, do not attempt to load data
      console.error('OwnerInvoicesComponent: user ID not available');
      return;
    }

    // Load units to resolve unit numbers for invoices
    this.ownerService.getMyUnits(userId).subscribe({
      next: (units) => {
        units.forEach((unit) => this.unitsById.set(unit.id, unit));
      },
      error: (error) => {
        console.error('Error loading owner units for invoices:', error);
      }
    });

    // Load invoices for the current owner
    this.ownerService.getMyInvoices(userId).subscribe({
      next: (backendInvoices) => {
        const mapped = backendInvoices.map((inv) => this.mapInvoice(inv));
        this.invoices.set(mapped);
        this.filteredInvoices.set(mapped);
      },
      error: (error) => {
        console.error('Error loading owner invoices:', error);
      }
    });
  }

  filterInvoices() {
    let filtered = this.invoices();

    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(i => i.status === this.selectedStatus);
    }

    if (this.selectedYear) {
      filtered = filtered.filter(i => i.date.getFullYear().toString() === this.selectedYear);
    }

    this.filteredInvoices.set(filtered);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'À payer',
      overdue: 'En retard',
      paid: 'Payée'
    };
    return labels[status] || status;
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
    const dueDate = new Date(inv.dueDate);
    const unit = this.unitsById.get(inv.unitId);

    return {
      id: inv.id,
      number: inv.invoiceNumber,
      date,
      dueDate,
      amount: inv.totalAmount,
      status: this.mapStatus(inv.status),
      period: this.getPeriodLabel(date),
      unitNumber: unit?.unitNumber ?? '—',
      copropertyName: unit ? `Copropriété ${unit.copropertyId.substring(0, 8)}` : '—',
      paymentDate: inv.paidDate ? new Date(inv.paidDate) : undefined
    };
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

    this.modalService.alert(
      `Facture #${invoice.number}`,
      `Période: ${invoice.period}\nMontant: ${invoice.amount.toFixed(2)}€\nStatut: ${this.getStatusLabel(invoice.status)}`
    );
  }

  downloadInvoice(id: string): void {
    const invoice = this.invoices().find(inv => inv.id === id);
    if (!invoice) return;

    this.fileService.downloadPDF(
      `Facture_${invoice.number}.pdf`,
      `Facture ${invoice.number} - ${invoice.period}`
    );
    
    this.toastService.show(
      `Facture ${invoice.number} téléchargée`,
      { classname: 'toast-success' }
    );
  }

  async payInvoice(id: string): Promise<void> {
    const invoice = this.invoices().find(inv => inv.id === id);
    if (!invoice || invoice.status === 'paid') return;

    const confirmed = await this.modalService.confirm({
      title: 'Confirmation de paiement',
      message: `Payer ${invoice.amount.toFixed(2)}€ pour ${invoice.period}?`,
      confirmButtonText: 'Payer',
      confirmButtonClass: 'btn-success'
    });

    if (confirmed) {
      setTimeout(() => {
        invoice.status = 'paid';
        invoice.paymentDate = new Date();
        this.invoices.set([...this.invoices()]);
        this.toastService.show(
          `Facture ${invoice.number} payée`,
          { classname: 'toast-success' }
        );
      }, 500);
    }
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
