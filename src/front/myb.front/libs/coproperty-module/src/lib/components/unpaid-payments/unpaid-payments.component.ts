import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CopropertyService } from '../../services/coproperty.service';
import { CurrencyService } from '../../services/currency.service';
import {
  UnpaidPaymentsSummary,
  OwnerPaymentSummary,
  PaymentHealthStatus,
  HEALTH_STATUS_CONFIG,
} from '../../models';

@Component({
  selector: 'myb-unpaid-payments',
  standalone: true,
  imports: [CommonModule, TranslateModule, RouterModule, FormsModule],
  templateUrl: './unpaid-payments.component.html',
  styleUrls: ['./unpaid-payments.component.scss'],
})
export class UnpaidPaymentsComponent implements OnInit {
  readonly summary = signal<UnpaidPaymentsSummary | null>(null);
  readonly isLoading = signal(true);
  readonly selectedFilter = signal<'all' | 'overdue' | 'pending'>('all');
  readonly expandedOwner = signal<string | null>(null);
  readonly searchTerm = signal<string>('');

  private readonly destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private copropertyService: CopropertyService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    const filter = this.route.snapshot.queryParamMap.get('filter');
    if (filter === 'overdue' || filter === 'pending') {
      this.selectedFilter.set(filter);
    }
    this.loadData();
  }

  formatAmount(amount: number): string {
    return this.currencyService.formatAmount(amount);
  }

  getHealthConfig(status: PaymentHealthStatus) {
    return HEALTH_STATUS_CONFIG[status] || HEALTH_STATUS_CONFIG[PaymentHealthStatus.Pending];
  }

  toggleOwnerExpand(ownerId: string): void {
    this.expandedOwner.set(this.expandedOwner() === ownerId ? null : ownerId);
  }

  get filteredOwners(): OwnerPaymentSummary[] {
    if (!this.summary()) return [];
    let owners = this.summary()!.ownerSummaries;

    const filter = this.selectedFilter();
    if (filter === 'overdue') {
      owners = owners.filter(o => o.overdueInvoiceCount > 0);
    } else if (filter === 'pending') {
      owners = owners.filter(o => o.pendingInvoiceCount > 0 && o.overdueInvoiceCount === 0);
    }

    const search = this.searchTerm().toLowerCase();
    if (search) {
      owners = owners.filter(
        o =>
          o.ownerName.toLowerCase().includes(search) ||
          o.email.toLowerCase().includes(search) ||
          o.unitNumbers.some(u => u.toLowerCase().includes(search))
      );
    }

    return owners;
  }

  getReminderLevelLabel(level: number): string {
    switch (level) {
      case 1: return 'Relance 1';
      case 2: return 'Relance 2';
      case 3: return 'Mise en demeure';
      default: return '';
    }
  }

  getReminderLevelBadge(level: number): string {
    switch (level) {
      case 1: return 'bg-warning text-dark';
      case 2: return 'bg-danger';
      case 3: return 'bg-dark';
      default: return 'bg-secondary';
    }
  }

  sendReminder(invoiceId: string, level: number): void {
    // TODO: Integrate with backend sendPaymentReminder mutation
    alert(`Relance niveau ${level} envoyée pour la facture ${invoiceId}`);
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.loadMockData();
  }

  private loadMockData(): void {
    this.summary.set({
      copropertyId: 'mock-id',
      totalOwners: 6,
      ownersWithOverdue: 3,
      totalOverdueInvoices: 5,
      totalOverdueAmount: 4850,
      totalPendingAmount: 2300,
      averageDaysOverdue: 32,
      ownerSummaries: [
        {
          ownerId: '1',
          ownerName: 'Ahmed Ben Ali',
          email: 'ahmed.benali@email.com',
          phone: '+216 98 765 432',
          unitNumbers: ['A101', 'A102'],
          totalDue: 3200,
          totalPaid: 800,
          totalOutstanding: 2400,
          totalOverdue: 2400,
          overdueInvoiceCount: 2,
          pendingInvoiceCount: 0,
          oldestOverdueDate: new Date('2025-12-15'),
          daysOverdue: 115,
          healthStatus: PaymentHealthStatus.Delinquent,
          invoices: [
            {
              invoiceId: 'inv-1',
              invoiceNumber: 'INV-2025-001',
              unitNumber: 'A101',
              chargeName: 'Charges Q4 2025',
              amount: 1800,
              paidAmount: 500,
              remainingAmount: 1300,
              dueDate: new Date('2025-12-15'),
              daysLate: 115,
              status: 'Overdue',
              reminderLevel: 3,
            },
            {
              invoiceId: 'inv-2',
              invoiceNumber: 'INV-2026-005',
              unitNumber: 'A102',
              chargeName: 'Charges Q1 2026',
              amount: 1400,
              paidAmount: 300,
              remainingAmount: 1100,
              dueDate: new Date('2026-03-01'),
              daysLate: 39,
              status: 'PartiallyPaid',
              reminderLevel: 2,
            },
          ],
        },
        {
          ownerId: '2',
          ownerName: 'Sophie Martin',
          email: 'sophie.martin@email.com',
          unitNumbers: ['B203'],
          totalDue: 1500,
          totalPaid: 0,
          totalOutstanding: 1500,
          totalOverdue: 1500,
          overdueInvoiceCount: 1,
          pendingInvoiceCount: 1,
          oldestOverdueDate: new Date('2026-02-15'),
          daysOverdue: 53,
          healthStatus: PaymentHealthStatus.Critical,
          invoices: [
            {
              invoiceId: 'inv-3',
              invoiceNumber: 'INV-2026-010',
              unitNumber: 'B203',
              chargeName: 'Charges Q1 2026',
              amount: 950,
              paidAmount: 0,
              remainingAmount: 950,
              dueDate: new Date('2026-02-15'),
              daysLate: 53,
              status: 'Overdue',
              reminderLevel: 2,
            },
            {
              invoiceId: 'inv-4',
              invoiceNumber: 'INV-2026-020',
              unitNumber: 'B203',
              chargeName: 'Assurance annuelle',
              amount: 550,
              paidAmount: 0,
              remainingAmount: 550,
              dueDate: new Date('2026-04-30'),
              daysLate: 0,
              status: 'Pending',
              reminderLevel: 0,
            },
          ],
        },
        {
          ownerId: '3',
          ownerName: 'Karim Jebali',
          email: 'karim.jebali@email.com',
          phone: '+216 55 123 456',
          unitNumbers: ['C305'],
          totalDue: 950,
          totalPaid: 0,
          totalOutstanding: 950,
          totalOverdue: 950,
          overdueInvoiceCount: 2,
          pendingInvoiceCount: 0,
          oldestOverdueDate: new Date('2026-03-01'),
          daysOverdue: 39,
          healthStatus: PaymentHealthStatus.Critical,
          invoices: [
            {
              invoiceId: 'inv-5',
              invoiceNumber: 'INV-2026-012',
              unitNumber: 'C305',
              chargeName: 'Nettoyage Mars',
              amount: 450,
              paidAmount: 0,
              remainingAmount: 450,
              dueDate: new Date('2026-03-01'),
              daysLate: 39,
              status: 'Overdue',
              reminderLevel: 2,
            },
            {
              invoiceId: 'inv-6',
              invoiceNumber: 'INV-2026-013',
              unitNumber: 'C305',
              chargeName: 'Électricité Mars',
              amount: 500,
              paidAmount: 0,
              remainingAmount: 500,
              dueDate: new Date('2026-03-15'),
              daysLate: 25,
              status: 'Overdue',
              reminderLevel: 1,
            },
          ],
        },
        {
          ownerId: '4',
          ownerName: 'Marie Dupont',
          email: 'marie.dupont@email.com',
          unitNumbers: ['A104'],
          totalDue: 800,
          totalPaid: 0,
          totalOutstanding: 800,
          totalOverdue: 0,
          overdueInvoiceCount: 0,
          pendingInvoiceCount: 1,
          daysOverdue: 0,
          healthStatus: PaymentHealthStatus.Pending,
          invoices: [
            {
              invoiceId: 'inv-7',
              invoiceNumber: 'INV-2026-025',
              unitNumber: 'A104',
              chargeName: 'Charges Q2 2026',
              amount: 800,
              paidAmount: 0,
              remainingAmount: 800,
              dueDate: new Date('2026-06-30'),
              daysLate: 0,
              status: 'Pending',
              reminderLevel: 0,
            },
          ],
        },
      ],
    });
    this.isLoading.set(false);
  }
}
