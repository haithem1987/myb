// Treasury models - mapping backend DTOs

export interface RealTreasury {
  openingBalance: number;
  totalEncaissements: number;
  totalDecaissements: number;
  currentBalance: number;
}

export interface AccountingTreasury {
  totalChargesEngaged: number;
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  totalOverdue: number;
  accountingBalance: number;
}

export interface TreasuryDashboard {
  copropertyId: string;
  copropertyName: string;
  realTreasury: RealTreasury;
  accountingTreasury: AccountingTreasury;
  workingCapitalGap: number;
  collectionRate: number;
  evolution: { month: string; date: Date; amount: number }[];
  expensesByType: ExpenseBreakdown[];
}

export interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export enum PaymentHealthStatus {
  Good = 'GOOD',
  Pending = 'PENDING',
  Late = 'LATE',
  Critical = 'CRITICAL',
  Delinquent = 'DELINQUENT',
}

export const HEALTH_STATUS_CONFIG: Record<PaymentHealthStatus, { label: string; badge: string; icon: string }> = {
  [PaymentHealthStatus.Good]: { label: 'À jour', badge: 'bg-success', icon: 'bi-check-circle-fill' },
  [PaymentHealthStatus.Pending]: { label: 'En attente', badge: 'bg-info', icon: 'bi-clock-fill' },
  [PaymentHealthStatus.Late]: { label: 'En retard', badge: 'bg-warning text-dark', icon: 'bi-exclamation-triangle-fill' },
  [PaymentHealthStatus.Critical]: { label: 'Critique', badge: 'bg-danger', icon: 'bi-exclamation-circle-fill' },
  [PaymentHealthStatus.Delinquent]: { label: 'Impayé', badge: 'bg-dark', icon: 'bi-x-circle-fill' },
};

export interface OwnerInvoiceDetail {
  invoiceId: string;
  invoiceNumber: string;
  unitNumber: string;
  chargeName: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: Date;
  daysLate: number;
  status: string;
  reminderLevel: number;
}

export interface OwnerPaymentSummary {
  ownerId: string;
  ownerName: string;
  email: string;
  phone?: string;
  unitNumbers: string[];
  totalDue: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  overdueInvoiceCount: number;
  pendingInvoiceCount: number;
  oldestOverdueDate?: Date;
  daysOverdue: number;
  healthStatus: PaymentHealthStatus;
  invoices: OwnerInvoiceDetail[];
}

export interface UnpaidPaymentsSummary {
  copropertyId: string;
  totalOwners: number;
  ownersWithOverdue: number;
  totalOverdueInvoices: number;
  totalOverdueAmount: number;
  totalPendingAmount: number;
  averageDaysOverdue: number;
  ownerSummaries: OwnerPaymentSummary[];
}
