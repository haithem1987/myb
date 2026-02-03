import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  Unit, 
  CopropertyInvoice, 
  MaintenanceRequest, 
  Payment,
  RecordPaymentInput
} from '../models';

// GraphQL Queries for Owner Portal
const GET_MY_UNITS = gql`
  query GetMyUnits($userId: UUID!) {
    unitsByOwner(ownerId: $userId) {
      id
      copropertyId
      unitNumber
      floor
      area
      shares
      unitType
      description
      isOccupied
      createdAt
      updatedAt
    }
  }
`;

const GET_MY_INVOICES = gql`
  query GetMyInvoices($ownerId: UUID!) {
    invoicesByOwner(ownerId: $ownerId) {
      id
      invoiceNumber
      chargeId
      unitId
      ownerId
      amount
      taxAmount
      totalAmount
      invoiceDate
      dueDate
      status
      paidDate
      paymentMethod
      notes
      createdAt
    }
  }
`;

const GET_MY_MAINTENANCE_REQUESTS = gql`
  query GetMyMaintenanceRequests($userId: UUID!) {
    myMaintenanceRequests(userId: $userId) {
      id
      copropertyId
      unitId
      requestedBy
      title
      description
      category
      priority
      status
      assignedTo
      estimatedCost
      actualCost
      scheduledDate
      completedDate
      createdAt
      updatedAt
    }
  }
`;

const GET_INVOICE_DETAILS = gql`
  query GetInvoiceDetails($invoiceId: UUID!) {
    invoice(id: $invoiceId) {
      id
      invoiceNumber
      chargeId
      unitId
      ownerId
      amount
      taxAmount
      totalAmount
      invoiceDate
      dueDate
      status
      paidDate
      paymentMethod
      notes
      createdAt
      charge {
        id
        name
        description
        chargeType
        frequency
      }
      unit {
        id
        unitNumber
        coproperty {
          id
          name
          address
        }
      }
      payments {
        id
        amount
        paymentDate
        paymentMethod
        transactionId
        notes
      }
    }
  }
`;

// Mutations
const RECORD_PAYMENT = gql`
  mutation RecordPayment($input: RecordPaymentInput!) {
    recordPayment(input: $input) {
      id
      invoiceId
      amount
      paymentDate
      paymentMethod
      transactionId
      notes
      createdAt
    }
  }
`;

const CREATE_MAINTENANCE_REQUEST = gql`
  mutation CreateMaintenanceRequest($input: CreateMaintenanceRequestInput!) {
    createMaintenanceRequest(request: $input) {
      id
      copropertyId
      unitId
      requestedBy
      title
      description
      category
      priority
      status
      createdAt
    }
  }
`;

export interface CreateMaintenanceRequestInput {
  copropertyId: string;
  unitId?: string;
  requestedBy: string;
  title: string;
  description: string;
  category: string;
  priority: string;
}

export interface InvoiceWithDetails extends CopropertyInvoice {
  charge?: {
    id: string;
    name: string;
    description?: string;
    chargeType: string;
    frequency: string;
  };
  unit?: {
    id: string;
    unitNumber: string;
    coproperty?: {
      id: string;
      name: string;
      address: string;
    };
  };
  payments?: Payment[];
}

@Injectable({
  providedIn: 'root'
})
export class OwnerService {
  constructor(private apollo: Apollo) {}

  /**
   * Get all units owned by the current user
   */
  getMyUnits(userId: string): Observable<Unit[]> {
    return this.apollo
      .watchQuery<{ unitsByOwner: Unit[] }>({
        query: GET_MY_UNITS,
        variables: { userId },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' }
      })
      .valueChanges.pipe(
        map(result => result.data.unitsByOwner)
      );
  }

  /**
   * Get all invoices for the current owner
   */
  getMyInvoices(ownerId: string): Observable<CopropertyInvoice[]> {
    return this.apollo
      .watchQuery<{ invoicesByOwner: CopropertyInvoice[] }>({
        query: GET_MY_INVOICES,
        variables: { ownerId },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' }
      })
      .valueChanges.pipe(
        map(result => result.data.invoicesByOwner)
      );
  }

  /**
   * Get detailed information about a specific invoice
   */
  getInvoiceDetails(invoiceId: string): Observable<InvoiceWithDetails> {
    return this.apollo
      .watchQuery<{ invoice: InvoiceWithDetails }>({
        query: GET_INVOICE_DETAILS,
        variables: { invoiceId },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' }
      })
      .valueChanges.pipe(
        map(result => result.data.invoice)
      );
  }

  /**
   * Get all maintenance requests created by the current user
   */
  getMyMaintenanceRequests(userId: string): Observable<MaintenanceRequest[]> {
    return this.apollo
      .watchQuery<{ myMaintenanceRequests: MaintenanceRequest[] }>({
        query: GET_MY_MAINTENANCE_REQUESTS,
        variables: { userId },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' }
      })
      .valueChanges.pipe(
        map(result => result.data.myMaintenanceRequests)
      );
  }

  /**
   * Record a payment for an invoice
   */
  recordPayment(input: RecordPaymentInput): Observable<Payment> {
    return this.apollo
      .mutate<{ recordPayment: Payment }>({
        mutation: RECORD_PAYMENT,
        variables: { input },
        context: { service: 'copropertyService' },
        refetchQueries: [
          { 
            query: GET_MY_INVOICES, 
            variables: { ownerId: input.invoiceId } // This should be updated with actual ownerId
          }
        ]
      })
      .pipe(
        map(result => result.data!.recordPayment)
      );
  }

  /**
   * Create a new maintenance request
   */
  createMaintenanceRequest(input: CreateMaintenanceRequestInput): Observable<MaintenanceRequest> {
    return this.apollo
      .mutate<{ createMaintenanceRequest: MaintenanceRequest }>({
        mutation: CREATE_MAINTENANCE_REQUEST,
        variables: { input },
        context: { service: 'copropertyService' },
        refetchQueries: [
          { 
            query: GET_MY_MAINTENANCE_REQUESTS, 
            variables: { userId: input.requestedBy }
          }
        ]
      })
      .pipe(
        map(result => result.data!.createMaintenanceRequest)
      );
  }

  /**
   * Calculate total pending amount for an owner
   */
  getTotalPendingAmount(invoices: CopropertyInvoice[]): number {
    return invoices
      .filter(inv => inv.status === 'Pending' || inv.status === 'Overdue' || inv.status === 'PartiallyPaid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
  }

  /**
   * Get overdue invoices count
   */
  getOverdueInvoicesCount(invoices: CopropertyInvoice[]): number {
    const now = new Date();
    return invoices.filter(inv => 
      (inv.status === 'Pending' || inv.status === 'PartiallyPaid') && 
      new Date(inv.dueDate) < now
    ).length;
  }

  /**
   * Get next payment due date
   */
  getNextPaymentDueDate(invoices: CopropertyInvoice[]): Date | null {
    const pendingInvoices = invoices
      .filter(inv => inv.status === 'Pending' || inv.status === 'PartiallyPaid')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return pendingInvoices.length > 0 ? new Date(pendingInvoices[0].dueDate) : null;
  }
}
