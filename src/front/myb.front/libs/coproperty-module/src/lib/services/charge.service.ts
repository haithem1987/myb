import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import {
  GET_ALL_CHARGES,
  GET_CHARGE_BY_ID,
  GET_CHARGES_BY_COPROPERTY,
  GET_COPROPERTY_CHARGE_DISTRIBUTIONS,
} from '../graphql/queries/charge.query';
import {
  CREATE_CHARGE,
  UPDATE_CHARGE,
  DELETE_CHARGE,
  CALCULATE_CHARGE_DISTRIBUTION,
  MARK_CHARGE_DISTRIBUTION_PAID,
} from '../graphql/mutations/charge.mutation';

export interface ChargeExtended {
  id?: string;
  copropertyId: string;
  name: string;
  description?: string;
  chargeType: 'CLEANING' | 'SECURITY' | 'MAINTENANCE' | 'ELECTRICITY' | 'WATER' | 'INSURANCE' | 'OTHER';
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'EXCEPTIONAL';
  totalAmount: number;
  distributionMethod: 'BY_SHARES' | 'BY_AREA' | 'EQUAL' | 'CUSTOM';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  isContribution: boolean;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChargeDistributionExtended {
  unitId: string;
  unitNumber: string;
  amount: number;
  shares?: number;
  area?: number;
}

export interface ChargeDistributionPayment {
  id: string;
  chargeId: string;
  unitId: string;
  amount: number;
  percentage: number;
  calculatedAt: string;
  paymentStatus: string;
  paidAmount: number;
  paidAt: string | null;
  paymentTransactionId: string | null;
  paymentMethod: string | null;
  unitNumber: string;
  shares: number;
  area: number;
  chargeName: string;
  chargeDescription: string;
  chargeType: string;
  chargeFrequency: string;
  currency: string;
  ownerName: string;
  ownerEmail: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChargeService {
  private apollo = inject(Apollo);

  getAllCharges(): Observable<ChargeExtended[]> {
    return this.apollo
      .query<{ allCharges: ChargeExtended[] }>({
        query: GET_ALL_CHARGES,
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data.allCharges));
  }

  getChargeById(id: string): Observable<ChargeExtended> {
    return this.apollo
      .query<{ chargeById: ChargeExtended }>({
        query: GET_CHARGE_BY_ID,
        variables: { id },
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data.chargeById));
  }

  getChargesByCoproperty(copropertyId: string): Observable<ChargeExtended[]> {
    return this.apollo
      .query<{ charges: ChargeExtended[] }>({
        query: GET_CHARGES_BY_COPROPERTY,
        variables: { copropertyId },
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data.charges));
  }

  createCharge(charge: ChargeExtended): Observable<ChargeExtended> {
    return this.apollo
      .mutate<{ createCharge: ChargeExtended }>({
        mutation: CREATE_CHARGE,
        variables: { item: charge },
        refetchQueries: [{ query: GET_CHARGES_BY_COPROPERTY, variables: { copropertyId: charge.copropertyId } }],
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.createCharge));
  }

  updateCharge(charge: ChargeExtended): Observable<ChargeExtended> {
    return this.apollo
      .mutate<{ updateCharge: ChargeExtended }>({
        mutation: UPDATE_CHARGE,
        variables: { item: charge },
        refetchQueries: [
          { query: GET_CHARGES_BY_COPROPERTY, variables: { copropertyId: charge.copropertyId } },
          { query: GET_ALL_CHARGES }
        ],
        awaitRefetchQueries: true,
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.updateCharge));
  }

  deleteCharge(id: string, copropertyId?: string): Observable<boolean> {
    const refetchQueries: any[] = [{ query: GET_ALL_CHARGES }];
    if (copropertyId) {
      refetchQueries.push({ query: GET_CHARGES_BY_COPROPERTY, variables: { copropertyId } });
    }
    return this.apollo
      .mutate<{ deleteCharge: boolean }>({
        mutation: DELETE_CHARGE,
        variables: { id },
        refetchQueries,
        awaitRefetchQueries: true,
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.deleteCharge));
  }

  calculateDistribution(chargeId: string): Observable<ChargeDistributionExtended[]> {
    return this.apollo
      .mutate<{ distributeCharge: ChargeDistributionExtended[] }>({
        mutation: CALCULATE_CHARGE_DISTRIBUTION,
        variables: { chargeId },
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.distributeCharge));
  }

  getCopropertyChargeDistributions(copropertyId: string): Observable<ChargeDistributionPayment[]> {
    return this.apollo
      .query<{ copropertyChargeDistributions: ChargeDistributionPayment[] }>({
        query: GET_COPROPERTY_CHARGE_DISTRIBUTIONS,
        variables: { copropertyId },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data.copropertyChargeDistributions));
  }

  markChargeDistributionPaid(
    distributionId: string,
    transactionId: string,
    paymentMethod: string,
    paidAmount: number
  ): Observable<ChargeDistributionPayment> {
    return this.apollo
      .mutate<{ markChargeDistributionPaid: ChargeDistributionPayment }>({
        mutation: MARK_CHARGE_DISTRIBUTION_PAID,
        variables: { distributionId, transactionId, paymentMethod, paidAmount },
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.markChargeDistributionPaid));
  }
}
