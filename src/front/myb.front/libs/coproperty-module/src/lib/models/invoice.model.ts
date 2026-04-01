export enum InvoiceStatus {
  Pending = 'PENDING',
  PartiallyPaid = 'PARTIALLY_PAID',
  Paid = 'PAID',
  Overdue = 'OVERDUE',
  Cancelled = 'CANCELLED'
}

export interface CopropertyInvoice {
  id: string;
  invoiceNumber: string;
  chargeId: string;
  unitId: string;
  ownerId: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  invoiceDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
  paidDate?: Date;
  paymentMethod?: string;
  description?: string;
  notes?: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

export interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
  createdBy: string;
}
