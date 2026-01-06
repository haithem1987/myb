import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  Charge, 
  CreateChargeInput, 
  UpdateChargeInput, 
  ChargeDistribution 
} from '../models';

const GET_CHARGES = gql`
  query GetCharges($copropertyId: UUID!) {
    charges(copropertyId: $copropertyId) {
      id
      copropertyId
      name
      description
      chargeType
      frequency
      totalAmount
      distributionMethod
      startDate
      endDate
      isActive
      createdAt
      createdBy
    }
  }
`;

const GET_CHARGE = gql`
  query GetCharge($id: UUID!) {
    charge(id: $id) {
      id
      copropertyId
      name
      description
      chargeType
      frequency
      totalAmount
      distributionMethod
      startDate
      endDate
      isActive
      createdAt
      createdBy
    }
  }
`;

const GET_ACTIVE_CHARGES = gql`
  query GetActiveCharges($copropertyId: UUID!) {
    activeCharges(copropertyId: $copropertyId) {
      id
      name
      chargeType
      frequency
      totalAmount
      distributionMethod
      startDate
      isActive
    }
  }
`;

const GET_CHARGE_DISTRIBUTIONS = gql`
  query GetChargeDistributions($chargeId: UUID!) {
    chargeDistributions(chargeId: $chargeId) {
      id
      chargeId
      unitId
      amount
      calculatedAt
    }
  }
`;

const CREATE_CHARGE = gql`
  mutation CreateCharge($input: CreateChargeInput!) {
    createCharge(input: $input) {
      id
      copropertyId
      name
      description
      chargeType
      frequency
      totalAmount
      distributionMethod
      startDate
      endDate
      isActive
      createdAt
      createdBy
    }
  }
`;

const UPDATE_CHARGE = gql`
  mutation UpdateCharge($id: UUID!, $input: UpdateChargeInput!) {
    updateCharge(id: $id, input: $input) {
      id
      name
      description
      chargeType
      frequency
      totalAmount
      distributionMethod
      startDate
      endDate
      isActive
    }
  }
`;

const DELETE_CHARGE = gql`
  mutation DeleteCharge($id: UUID!) {
    deleteCharge(id: $id)
  }
`;

const DISTRIBUTE_CHARGE = gql`
  mutation DistributeCharge($chargeId: UUID!) {
    distributeCharge(chargeId: $chargeId) {
      id
      chargeId
      unitId
      amount
      calculatedAt
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class ChargeService {
  constructor(private apollo: Apollo) {}

  getCharges(copropertyId: string): Observable<Charge[]> {
    return this.apollo
      .watchQuery<{ charges: Charge[] }>({
        query: GET_CHARGES,
        variables: { copropertyId }
      })
      .valueChanges.pipe(
        map(result => result.data.charges)
      );
  }

  getCharge(id: string): Observable<Charge> {
    return this.apollo
      .watchQuery<{ charge: Charge }>({
        query: GET_CHARGE,
        variables: { id }
      })
      .valueChanges.pipe(
        map(result => result.data.charge)
      );
  }

  getActiveCharges(copropertyId: string): Observable<Charge[]> {
    return this.apollo
      .watchQuery<{ activeCharges: Charge[] }>({
        query: GET_ACTIVE_CHARGES,
        variables: { copropertyId }
      })
      .valueChanges.pipe(
        map(result => result.data.activeCharges)
      );
  }

  getChargeDistributions(chargeId: string): Observable<ChargeDistribution[]> {
    return this.apollo
      .watchQuery<{ chargeDistributions: ChargeDistribution[] }>({
        query: GET_CHARGE_DISTRIBUTIONS,
        variables: { chargeId }
      })
      .valueChanges.pipe(
        map(result => result.data.chargeDistributions)
      );
  }

  createCharge(input: CreateChargeInput): Observable<Charge> {
    return this.apollo
      .mutate<{ createCharge: Charge }>({
        mutation: CREATE_CHARGE,
        variables: { input },
        refetchQueries: [{ 
          query: GET_CHARGES,
          variables: { copropertyId: input.copropertyId }
        }]
      })
      .pipe(
        map(result => result.data!.createCharge)
      );
  }

  updateCharge(id: string, input: UpdateChargeInput): Observable<Charge> {
    return this.apollo
      .mutate<{ updateCharge: Charge }>({
        mutation: UPDATE_CHARGE,
        variables: { id, input }
      })
      .pipe(
        map(result => result.data!.updateCharge)
      );
  }

  deleteCharge(id: string): Observable<boolean> {
    return this.apollo
      .mutate<{ deleteCharge: boolean }>({
        mutation: DELETE_CHARGE,
        variables: { id }
      })
      .pipe(
        map(result => result.data!.deleteCharge)
      );
  }

  distributeCharge(chargeId: string): Observable<ChargeDistribution[]> {
    return this.apollo
      .mutate<{ distributeCharge: ChargeDistribution[] }>({
        mutation: DISTRIBUTE_CHARGE,
        variables: { chargeId },
        refetchQueries: [{ 
          query: GET_CHARGE_DISTRIBUTIONS,
          variables: { chargeId }
        }]
      })
      .pipe(
        map(result => result.data!.distributeCharge)
      );
  }
}
