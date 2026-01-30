import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import {
  GET_ALL_CHARGES,
  GET_CHARGE_BY_ID,
  GET_CHARGES_BY_COPROPERTY,
} from '../graphql/queries/charge.query';
import {
  CREATE_CHARGE,
  UPDATE_CHARGE,
  DELETE_CHARGE,
  CALCULATE_CHARGE_DISTRIBUTION,
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

@Injectable({
  providedIn: 'root',
})
export class ChargeService {
  private apollo = inject(Apollo);

  getAllCharges(): Observable<ChargeExtended[]> {
    return this.apollo
      .query<{ allCharges: ChargeExtended[] }>({
        query: GET_ALL_CHARGES,
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
        refetchQueries: [{ query: GET_CHARGES_BY_COPROPERTY, variables: { copropertyId: charge.copropertyId } }],
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.updateCharge));
  }

  deleteCharge(id: string): Observable<boolean> {
    return this.apollo
      .mutate<{ deleteCharge: boolean }>({
        mutation: DELETE_CHARGE,
        variables: { id },
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.deleteCharge));
  }

  calculateDistribution(chargeId: string): Observable<ChargeDistributionExtended[]> {
    return this.apollo
      .mutate<{ calculateChargeDistribution: ChargeDistributionExtended[] }>({
        mutation: CALCULATE_CHARGE_DISTRIBUTION,
        variables: { chargeId },
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.calculateChargeDistribution));
  }
}
