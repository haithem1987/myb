import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  Coproperty, 
  CreateCopropertyInput,
  FundCall,
  CreateFundCallInput,
  DashboardStats,
  TreasuryDataPoint,
  ChargeDistributionData,
  FinancialReport
} from '../models';

const GET_COPROPERTIES = gql`
  query GetCoproperties {
    coproperties {
      id
      name
      address
      city
      postalCode
      country
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

const GET_COPROPERTIES_BY_MANAGER = gql`
  query GetCopropertiesByManager($managerId: UUID!) {
    copropertiesByManager(managerId: $managerId) {
      id
      name
      address
      city
      postalCode
      country
      totalUnits
      totalShares
      isActive
      createdAt
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
      totalBalance
      totalCharges
      pendingMaintenance
      overdueInvoices
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

@Injectable({
  providedIn: 'root'
})
export class CopropertyService {
  constructor(private apollo: Apollo) {}

  getCoproperties(): Observable<Coproperty[]> {
    return this.apollo
      .watchQuery<{ coproperties: Coproperty[] }>({
        query: GET_COPROPERTIES,
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' }
      })
      .valueChanges.pipe(
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
        refetchQueries: [{ query: GET_COPROPERTIES }],
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
        refetchQueries: [{ query: GET_COPROPERTIES }, { query: GET_COPROPERTY, variables: { id } }],
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
        refetchQueries: [{ query: GET_COPROPERTIES }],
        context: { service: 'copropertyService' }
      })
      .pipe(
        map(result => result.data!.deleteCoproperty)
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
}
