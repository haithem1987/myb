import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { KeycloakService } from '@myb-front/auth';
import { 
  Coproperty,
  Currency,
  CreateCopropertyInput,
  FundCall,
  CreateFundCallInput,
  DashboardStats,
  TreasuryDataPoint,
  ChargeDistributionData,
  FinancialReport,
  ManagerUser,
  TreasuryDashboard,
  UnpaidPaymentsSummary,
  OwnerPaymentSummary
} from '../models';

const GET_COPROPERTIES = gql`
  query GetCoproperties($managerId: UUID) {
    coproperties(managerId: $managerId) {
      id
      name
      address
      city
      postalCode
      country
      currency
      description
      totalUnits
      totalShares
      commonAreas
      managerName
      managerId
      isActive
      createdAt
      updatedAt
    }
  }
`;

const GET_COPROPERTY = gql`
  query GetCopropertyById($id: UUID!) {
    copropertyById(id: $id) {
      id
      name
      address
      city
      postalCode
      country
      currency
      description
      totalUnits
      totalShares
      commonAreas
      managerName
      managerId
      isActive
      createdAt
      updatedAt
    }
  }
`;

const CREATE_COPROPERTY = gql`
  mutation CreateCoproperty($coproperty: CopropertyInput!) {
    createCoproperty(coproperty: $coproperty) {
      id
      name
      address
      city
      postalCode
      country
      currency
      description
      totalUnits
      totalShares
      commonAreas
      managerName
      managerId
      isActive
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_COPROPERTY = gql`
  mutation UpdateCoproperty($id: UUID!, $coproperty: CopropertyInput!) {
    updateCoproperty(id: $id, coproperty: $coproperty) {
      id
      name
      address
      city
      postalCode
      country
      currency
      description
      totalUnits
      totalShares
      commonAreas
      managerName
      managerId
      isActive
      createdAt
      updatedAt
    }
  }
`;

const DELETE_COPROPERTY = gql`
  mutation DeleteCoproperty($id: UUID!) {
    deleteCoproperty(id: $id)
  }
`;

const CHECK_COPROPERTY_NAME_EXISTS = gql`
  query CheckCopropertyNameExists($name: String!, $excludeId: UUID) {
    copropertyByName(name: $name, excludeId: $excludeId) {
      id
      name
    }
  }
`;

const CREATE_FUND_CALL = gql`
  mutation CreateFundCall($input: CreateFundCallInput!) {
    createFundCall(input: $input) {
      id
      copropertyId
      amount
      dueDate
      description
      isActive
      createdAt
      updatedAt
    }
  }
`;

const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats($copropertyId: UUID) {
    dashboardStats(copropertyId: $copropertyId) {
      totalCoproperties
      totalUnits
      occupiedUnits
      totalBalance
      totalCharges
      pendingMaintenance
      overdueInvoices
      totalOwners
      activeCharges
      totalArea
      occupancyRate
    }
  }
`;

const GET_TREASURY_EVOLUTION = gql`
  query GetTreasuryEvolution($copropertyId: UUID!, $months: Int) {
    treasuryEvolution(copropertyId: $copropertyId, months: $months) {
      month
      date
      amount
    }
  }
`;

// Note: Charges distribution query not yet implemented in backend
// Using financial report with year parameter instead

const GET_FINANCIAL_REPORT = gql`
  query GetFinancialReport($copropertyId: UUID!, $year: Int!) {
    financialReport(copropertyId: $copropertyId, year: $year) {
      copropertyId
      year
      totalCharges
      totalCollected
      totalOverdue
      balance
      monthlyBalances {
        month
        monthName
        opening
        receipts
        expenses
        closing
      }
    }
  }
`;

const GET_MANAGERS = gql`
  query GetManagers {
    managers {
      id
      fullName
      email
    }
  }
`;

const GET_TREASURY_DASHBOARD = gql`
  query GetTreasuryDashboard($copropertyId: UUID!, $months: Int) {
    treasuryDashboard(copropertyId: $copropertyId, months: $months) {
      copropertyId
      copropertyName
      realTreasury {
        openingBalance
        totalEncaissements
        totalDecaissements
        currentBalance
      }
      accountingTreasury {
        totalChargesEngaged
        totalInvoiced
        totalCollected
        totalOutstanding
        totalOverdue
        accountingBalance
      }
      workingCapitalGap
      collectionRate
      evolution {
        month
        date
        amount
      }
      expensesByType {
        category
        amount
        percentage
      }
    }
  }
`;

const GET_UNPAID_PAYMENTS_SUMMARY = gql`
  query GetUnpaidPaymentsSummary($copropertyId: UUID!) {
    unpaidPaymentsSummary(copropertyId: $copropertyId) {
      copropertyId
      totalOwners
      ownersWithOverdue
      totalOverdueInvoices
      totalOverdueAmount
      totalPendingAmount
      averageDaysOverdue
      ownerSummaries {
        ownerId
        ownerName
        email
        phone
        unitNumbers
        totalDue
        totalPaid
        totalOutstanding
        totalOverdue
        overdueInvoiceCount
        pendingInvoiceCount
        oldestOverdueDate
        daysOverdue
        healthStatus
        invoices {
          invoiceId
          invoiceNumber
          unitNumber
          chargeName
          amount
          paidAmount
          remainingAmount
          dueDate
          daysLate
          status
          reminderLevel
        }
      }
    }
  }
`;

const GET_OWNER_PAYMENT_SUMMARY = gql`
  query GetOwnerPaymentSummary($ownerId: UUID!, $copropertyId: UUID) {
    ownerPaymentSummary(ownerId: $ownerId, copropertyId: $copropertyId) {
      ownerId
      ownerName
      email
      unitNumbers
      totalDue
      totalPaid
      totalOutstanding
      totalOverdue
      overdueInvoiceCount
      pendingInvoiceCount
      daysOverdue
      healthStatus
      invoices {
        invoiceId
        invoiceNumber
        unitNumber
        chargeName
        amount
        paidAmount
        remainingAmount
        dueDate
        daysLate
        status
        reminderLevel
      }
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class CopropertyService {
  constructor(private apollo: Apollo, private keycloakService: KeycloakService) {}

  getCoproperties(managerId?: string): Observable<Coproperty[]> {
    const effectiveManagerId = managerId ?? this.keycloakService.getSyndicManagerId();
    return this.apollo
      .query<{ coproperties: Coproperty[] }>({
        query: GET_COPROPERTIES,
        variables: { managerId: effectiveManagerId || undefined },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' }
      })
      .pipe(
        map(result => result.data.coproperties)
      );
  }

  getCoproperty(id: string): Observable<Coproperty> {
    return this.apollo
        .watchQuery<{ copropertyById: Coproperty }>({
        query: GET_COPROPERTY,
        variables: { id },
        context: { service: 'copropertyService' }
      })
      .valueChanges.pipe(
          map(result => result.data.copropertyById)
      );
  }

    getDashboardStats(copropertyId?: string): Observable<DashboardStats> {
      return this.apollo
        .watchQuery<{ dashboardStats: DashboardStats }>({
          query: GET_DASHBOARD_STATS,
          variables: { copropertyId },
          fetchPolicy: 'network-only',
          context: { service: 'copropertyService' }
        })
        .valueChanges
        .pipe(
          map(result => result.data.dashboardStats)
        );
    }

  createCoproperty(input: CreateCopropertyInput): Observable<Coproperty> {
    return this.apollo
      .mutate<{ createCoproperty: Coproperty }>({
        mutation: CREATE_COPROPERTY,
        variables: { coproperty: input },
        // No refetchQueries here: GET_COPROPERTIES now takes an optional
        // managerId variable, and refetching without it would run an
        // unfiltered fetch distinct from the caller's scoped query. Callers
        // already reload the list explicitly (with the correct managerId)
        // after this mutation resolves.
        context: { service: 'copropertyService' }
      })
      .pipe(
        map(result => result.data!.createCoproperty)
      );
  }

  updateCoproperty(id: string, input: CreateCopropertyInput): Observable<Coproperty> {
    return this.apollo
      .mutate<{ updateCoproperty: Coproperty }>({
        mutation: UPDATE_COPROPERTY,
        variables: { id, coproperty: input },
        refetchQueries: [{ query: GET_COPROPERTY, variables: { id } }],
        awaitRefetchQueries: true,
        context: { service: 'copropertyService' }
      })
      .pipe(
        map(result => result.data!.updateCoproperty)
      );
  }

  deleteCoproperty(id: string): Observable<boolean> {
    return this.apollo
      .mutate<{ deleteCoproperty: boolean }>({
        mutation: DELETE_COPROPERTY,
        variables: { id },
        context: { service: 'copropertyService' }
      })
      .pipe(
        map(result => result.data!.deleteCoproperty)
      );
  }

  checkCopropertyNameExists(name: string, excludeId?: string): Observable<boolean> {
    return this.apollo
      .query<{ copropertyByName: Coproperty | null }>({
        query: CHECK_COPROPERTY_NAME_EXISTS,
        variables: { name, excludeId },
        context: { service: 'copropertyService' },
        fetchPolicy: 'network-only'
      })
      .pipe(
        map(result => result.data.copropertyByName !== null)
      );
  }

  createFundCall(input: CreateFundCallInput): Observable<FundCall> {
    return this.apollo
      .mutate<{ createFundCall: FundCall }>({
        mutation: CREATE_FUND_CALL,
        variables: { input },
        context: {
          service: 'copropertyService',
          fetchOptions: { cache: 'no-store' },
          headers: { 'Cache-Control': 'no-cache' }
        }
      })
      .pipe(
        map(result => result.data!.createFundCall)
      );
  }


  getTreasuryEvolution(copropertyId: string, months: number = 12): Observable<TreasuryDataPoint[]> {
    return this.apollo
        .watchQuery<{ treasuryEvolution: TreasuryDataPoint[] }>({
        query: GET_TREASURY_EVOLUTION,
        variables: { copropertyId, months },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' }
      })
      .valueChanges.pipe(
          map(result => result.data.treasuryEvolution)
      );
  }

  // Get charges distribution for a coproperty
  getChargesDistribution(copropertyId: string): Observable<ChargeDistributionData[]> {
    // Note: Charges are fetched from the charge service
    // This is a placeholder that returns empty array - charges should be fetched separately
    return new Observable(observer => {
      observer.next([]);
      observer.complete();
    });
  }

  getFinancialReport(
    copropertyId: string,
    year: number
  ): Observable<FinancialReport> {
    return this.apollo
        .watchQuery<{ financialReport: FinancialReport }>({
        query: GET_FINANCIAL_REPORT,
        variables: { copropertyId, year },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' }
      })
      .valueChanges.pipe(
          map(result => result.data.financialReport)
      );
  }

  getManagers(): Observable<ManagerUser[]> {
    return this.apollo
      .watchQuery<{ managers: ManagerUser[] }>({
        query: GET_MANAGERS,
        fetchPolicy: 'cache-first',
        context: { service: 'copropertyService' }
      })
      .valueChanges.pipe(
        map(result => result.data.managers)
      );
  }

  /**
   * Fetch managers with network-only policy — bypasses cache.
   * Use this for refresh/reload actions.
   */
  reloadManagers(): Observable<ManagerUser[]> {
    return this.apollo
      .watchQuery<{ managers: ManagerUser[] }>({
        query: GET_MANAGERS,
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' }
      })
      .valueChanges.pipe(
        map(result => result.data.managers)
      );
  }

  getTreasuryDashboard(copropertyId: string, months: number = 12): Observable<TreasuryDashboard> {
    return this.apollo
      .watchQuery<{ treasuryDashboard: TreasuryDashboard }>({
        query: GET_TREASURY_DASHBOARD,
        variables: { copropertyId, months },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' }
      })
      .valueChanges.pipe(
        map(result => result.data.treasuryDashboard)
      );
  }

  getUnpaidPaymentsSummary(copropertyId: string): Observable<UnpaidPaymentsSummary> {
    return this.apollo
      .watchQuery<{ unpaidPaymentsSummary: UnpaidPaymentsSummary }>({
        query: GET_UNPAID_PAYMENTS_SUMMARY,
        variables: { copropertyId },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' }
      })
      .valueChanges.pipe(
        map(result => result.data.unpaidPaymentsSummary)
      );
  }

  getOwnerPaymentSummary(ownerId: string, copropertyId?: string): Observable<OwnerPaymentSummary> {
    return this.apollo
      .watchQuery<{ ownerPaymentSummary: OwnerPaymentSummary }>({
        query: GET_OWNER_PAYMENT_SUMMARY,
        variables: { ownerId, copropertyId },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' }
      })
      .valueChanges.pipe(
        map(result => result.data.ownerPaymentSummary)
      );
  }
}
