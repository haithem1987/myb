import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  Unit, 
  CopropertyInvoice, 
  MaintenanceRequest, 
  Payment,
  RecordPaymentInput,
  ChargeDistribution
} from '../models';
import { CreateOwnerWithUnitsInput, Owner, OwnerWithUnits } from '../models/owner.model';

// GraphQL Queries for Owner Management
const GET_ALL_OWNERS = gql`
  query GetOwners($copropertyId: UUID!) {
    owners(copropertyId: $copropertyId) {
      id
      userId
      firstName
      lastName
      email
      phone
      createdAt
      updatedAt
      ownerUnits {
        id
        unitId
        ownershipPercentage
        isMainOwner
        startDate
        endDate
        unit {
          id
          unitNumber
          copropertyId
        }
      }
    }
  }
`;

const GET_OWNER_BY_ID = gql`
  query GetOwnerById($id: UUID!) {
    ownerById(id: $id) {
      id
      userId
      firstName
      lastName
      email
      phone
      createdAt
      updatedAt
      ownerUnits {
        id
        unitId
        ownershipPercentage
        isMainOwner
        startDate
        endDate
        unit {
          id
          unitNumber
          copropertyId
        }
      }
    }
  }
`;

const GET_OWNER_BY_USER_ID = gql`
  query GetOwnerByUserId($userId: UUID!) {
    ownerByUserId(userId: $userId) {
      id
      userId
      firstName
      lastName
      email
      phone
      createdAt
      updatedAt
      ownerUnits {
        id
        unitId
        ownershipPercentage
        isMainOwner
        startDate
        endDate
        unit {
          id
          unitNumber
          copropertyId
        }
      }
    }
  }
`;

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
      description
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

// Owner Management Mutations
const CREATE_OWNER_WITH_UNITS = gql`
  mutation CreateOwnerWithUnits($input: CreateOwnerWithUnitsInput!) {
    createOwnerWithUnits(input: $input) {
      id
      userId
      firstName
      lastName
      email
      phone
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_OWNER_WITH_UNITS = gql`
  mutation UpdateOwnerWithUnits($id: UUID!, $input: CreateOwnerWithUnitsInput!) {
    updateOwnerWithUnits(id: $id, input: $input) {
      id
      userId
      firstName
      lastName
      email
      phone
      createdAt
      updatedAt
    }
  }
`;

const DELETE_OWNER = gql`
  mutation RemoveOwner($id: UUID!) {
    removeOwner(id: $id)
  }
`;

const GET_OWNER_CHARGE_DISTRIBUTIONS = gql`
  query GetOwnerChargeDistributions($ownerId: UUID!) {
    ownerChargeDistributions(ownerId: $ownerId) {
      id
      chargeId
      unitId
      amount
      percentage
      calculatedAt
      paymentStatus
      paidAmount
      paidAt
      paymentTransactionId
      paymentMethod
      unitNumber
      shares
      area
      chargeName
      chargeDescription
      chargeType
      chargeFrequency
      currency
    }
  }
`;

const MARK_CHARGE_DISTRIBUTION_PAID = gql`
  mutation MarkChargeDistributionPaid(
    $distributionId: UUID!
    $transactionId: String!
    $paymentMethod: String!
    $paidAmount: Decimal!
  ) {
    markChargeDistributionPaid(
      distributionId: $distributionId
      transactionId: $transactionId
      paymentMethod: $paymentMethod
      paidAmount: $paidAmount
    ) {
      id
      paymentStatus
      paidAmount
      paidAt
      paymentTransactionId
      paymentMethod
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

  /**
   * Get all owners for a coproperty
   */
  getAllOwners(copropertyId: string): Observable<OwnerWithUnits[]> {
    return this.apollo
      .watchQuery<{ owners: OwnerWithUnits[] }>({
        query: GET_ALL_OWNERS,
        variables: { copropertyId },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' }
      })
      .valueChanges.pipe(
        map(result => result.data.owners)
      );
  }

  /**
   * Get owner by ID
   */
  getOwnerById(id: string): Observable<OwnerWithUnits> {
    return this.apollo
      .watchQuery<{ ownerById: OwnerWithUnits }>({
        query: GET_OWNER_BY_ID,
        variables: { id },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' }
      })
      .valueChanges.pipe(
        map(result => result.data.ownerById)
      );
  }

  /**
   * Get owner by Keycloak user ID
   */
  getOwnerByUserId(userId: string): Observable<OwnerWithUnits | null> {
    return this.apollo
      .query<{ ownerByUserId: OwnerWithUnits | null }>({
        query: GET_OWNER_BY_USER_ID,
        variables: { userId },
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
        context: { service: 'copropertyService' }
      })
      .pipe(
        map(result => result.data?.ownerByUserId ?? null)
      );
  }

  /**
   * Like getOwnerByUserId but returns the raw Apollo result so callers can
   * distinguish between "not found" (null data, no errors) and a backend error.
   */
  getOwnerByUserIdRaw(userId: string): Observable<{ data: OwnerWithUnits | null; errors?: readonly any[] }> {
    return this.apollo
      .query<{ ownerByUserId: OwnerWithUnits | null }>({
        query: GET_OWNER_BY_USER_ID,
        variables: { userId },
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
        context: { service: 'copropertyService' }
      })
      .pipe(
        map(result => ({
          data: result.data?.ownerByUserId ?? null,
          errors: result.errors
        }))
      );
  }

  /**
   * Create a new owner with units
   */
  createOwner(input: CreateOwnerWithUnitsInput, copropertyId?: string): Observable<Owner> {
    const refetchQueries: any[] = [];
    if (copropertyId) {
      refetchQueries.push({ query: GET_ALL_OWNERS, variables: { copropertyId } });
    }
    return this.apollo
      .mutate<{ createOwnerWithUnits: Owner }>({
        mutation: CREATE_OWNER_WITH_UNITS,
        variables: { input },
        context: { service: 'copropertyService' },
        refetchQueries,
        awaitRefetchQueries: true
      })
      .pipe(
        map(result => result.data!.createOwnerWithUnits)
      );
  }

  /**
   * Update an existing owner with units
   */
  updateOwner(id: string, input: CreateOwnerWithUnitsInput, copropertyId?: string): Observable<Owner> {
    const refetchQueries: any[] = [];
    if (copropertyId) {
      refetchQueries.push({ query: GET_ALL_OWNERS, variables: { copropertyId } });
      refetchQueries.push({ query: GET_OWNER_BY_ID, variables: { id } });
    }
    return this.apollo
      .mutate<{ updateOwnerWithUnits: Owner }>({
        mutation: UPDATE_OWNER_WITH_UNITS,
        variables: { id, input },
        context: { service: 'copropertyService' },
        refetchQueries,
        awaitRefetchQueries: true
      })
      .pipe(
        map(result => result.data!.updateOwnerWithUnits)
      );
  }

  /**
   * Delete an owner
   */
  deleteOwner(id: string, copropertyId?: string): Observable<boolean> {
    const refetchQueries: any[] = [];
    if (copropertyId) {
      refetchQueries.push({ query: GET_ALL_OWNERS, variables: { copropertyId } });
    }
    return this.apollo
      .mutate<{ removeOwner: boolean }>({
        mutation: DELETE_OWNER,
        variables: { id },
        context: { service: 'copropertyService' },
        refetchQueries,
        awaitRefetchQueries: true
      })
      .pipe(
        map(result => result.data!.removeOwner)
      );
  }

  /**
   * Get all charge distributions for an owner (their share of coproperty charges)
   */
  getOwnerChargeDistributions(ownerId: string): Observable<ChargeDistribution[]> {
    return this.apollo
      .watchQuery<{ ownerChargeDistributions: ChargeDistribution[] }>({
        query: GET_OWNER_CHARGE_DISTRIBUTIONS,
        variables: { ownerId },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' }
      })
      .valueChanges.pipe(
        map(result => result.data.ownerChargeDistributions)
      );
  }

  /**
   * Mark a charge distribution as paid after payment service confirms payment
   */
  markChargeDistributionPaid(
    distributionId: string,
    transactionId: string,
    paymentMethod: string,
    paidAmount: number
  ): Observable<ChargeDistribution> {
    return this.apollo
      .mutate<{ markChargeDistributionPaid: ChargeDistribution }>({
        mutation: MARK_CHARGE_DISTRIBUTION_PAID,
        variables: { distributionId, transactionId, paymentMethod, paidAmount },
        context: { service: 'copropertyService' }
      })
      .pipe(
        map(result => result.data!.markChargeDistributionPaid)
      );
  }
}
