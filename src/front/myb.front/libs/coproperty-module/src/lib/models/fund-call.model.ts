import { Currency } from './coproperty.models';

// ─── Status enum — values match HotChocolate's SCREAMING_SNAKE_CASE output ───
export type FundCallStatus = 'TO_PAY' | 'PENDING_VALIDATION' | 'PAID' | 'VALIDATED' | 'CANCELLED';

/** French display labels for fund call statuses */
export const FUND_CALL_STATUS_LABELS: Record<FundCallStatus, string> = {
  TO_PAY: 'À payer',
  PENDING_VALIDATION: 'En attente de validation',
  PAID: 'Réglé',
  VALIDATED: 'Validé',
  CANCELLED: 'Annulé',
};

/** Bootstrap badge color classes for each status */
export const FUND_CALL_STATUS_BADGE: Record<FundCallStatus, string> = {
  TO_PAY: 'bg-warning text-dark',
  PENDING_VALIDATION: 'bg-info text-dark',
  PAID: 'bg-success',
  VALIDATED: 'bg-primary',
  CANCELLED: 'bg-secondary',
};

// ─── Owner summary (minimal) ─────────────────────────────────────────────────
export interface FundCallOwner {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

// ─── Payment on a fund call ──────────────────────────────────────────────────
export interface FundCallPayment {
  id: string;
  fundCallId: string;
  amount: number;
  paymentDate: Date;
  justificatif?: string;
  paymentMethod?: string;
  /** Pending | Approved | Rejected */
  validationStatus: string;
  rejectionReason?: string;
  createdAt: Date;
}

// ─── Core FundCall model ─────────────────────────────────────────────────────
export interface FundCall {
  id: string;
  copropertyId: string;
  copropertyName?: string;
  ownerName?: string;
  ownerId?: string;
  owner?: FundCallOwner;
  amount: number;
  dueDate: Date;
  description?: string;
  status: FundCallStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  currency: Currency;
  payments?: FundCallPayment[];

  // ── Server-computed flags (FRS-FCF-LCM-2026-001) ──────────────────────────
  /** True only for true drafts (TO_PAY, no payments, no invoices, ≤30 days old). */
  deletable?: boolean;
  /** False when the fund call is in the terminal CANCELLED state. */
  cancellable?: boolean;
  /** French reason why a hard delete is blocked; null when the row is deletable. */
  deleteBlockerReason?: string | null;
  /** Audit-log entries, newest first. Optional — only loaded on demand. */
  auditLog?: FundCallAuditLogEntry[];
}

/** Audit-log entry (FRS-FCF-LCM-2026-001 §2.4). */
export interface FundCallAuditLogEntry {
  id: string;
  fundCallId: string;
  action: FundCallAuditAction;
  previousStatus?: FundCallStatus;
  newStatus?: FundCallStatus;
  reason?: string;
  actorUserId: string;
  actorRole?: string;
  actorDisplayName?: string;
  createdAt?: Date;
}

export type FundCallAuditAction =
  | 'Created'
  | 'Updated'
  | 'Published'
  | 'PaymentAdded'
  | 'PaymentApproved'
  | 'PaymentRejected'
  | 'Cancelled'
  | 'Deleted';

// ─── DTOs ────────────────────────────────────────────────────────────────────
export interface CreateFundCallInput {
  copropertyId?: string;
  ownerId?: string;
  amount: number;
  dueDate: Date;
  description?: string;
  status?: FundCallStatus;
}

export interface UpdateFundCallInput {
  status: FundCallStatus;
}

export interface AddFundCallPaymentInput {
  amount: number;
  paymentDate: Date;
  justificatif?: string;
  paymentMethod?: string;
}

export interface ReviewFundCallPaymentInput {
  paymentId: string;
  approved: boolean;
  rejectionReason?: string;
}

/** Payment enriched with its parent fund call info – used in the receipts page */
export interface FundCallPaymentWithContext extends FundCallPayment {
  fundCall: Pick<FundCall, 'id' | 'description' | 'amount' | 'dueDate' | 'currency'> & {
    coproperty?: { id: string; name: string };
  };
}

