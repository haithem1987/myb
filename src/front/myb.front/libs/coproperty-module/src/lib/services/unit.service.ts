import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Unit, CreateUnitInput, UpdateUnitInput } from '../models';

const GET_UNITS = gql`
  query GetUnits($copropertyId: UUID!) {
    units(copropertyId: $copropertyId) {
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

const GET_UNIT = gql`
  query GetUnit($id: UUID!) {
    unit(id: $id) {
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

const CREATE_UNIT = gql`
  mutation CreateUnit($input: CreateUnitInput!) {
    createUnit(input: $input) {
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

const UPDATE_UNIT = gql`
  mutation UpdateUnit($id: UUID!, $input: UpdateUnitInput!) {
    updateUnit(id: $id, input: $input) {
      id
      unitNumber
      floor
      area
      shares
      unitType
      description
      isOccupied
      updatedAt
    }
  }
`;

const DELETE_UNIT = gql`
  mutation DeleteUnit($id: UUID!) {
    deleteUnit(id: $id)
  }
`;

@Injectable({
  providedIn: 'root'
})
export class UnitService {
  constructor(private apollo: Apollo) {}

  getUnits(copropertyId: string): Observable<Unit[]> {
    return this.apollo
      .watchQuery<{ units: Unit[] }>({
        query: GET_UNITS,
        variables: { copropertyId }
      })
      .valueChanges.pipe(
        map(result => result.data.units)
      );
  }

  getUnit(id: string): Observable<Unit> {
    return this.apollo
      .watchQuery<{ unit: Unit }>({
        query: GET_UNIT,
        variables: { id }
      })
      .valueChanges.pipe(
        map(result => result.data.unit)
      );
  }

  createUnit(input: CreateUnitInput): Observable<Unit> {
    return this.apollo
      .mutate<{ createUnit: Unit }>({
        mutation: CREATE_UNIT,
        variables: { input },
        refetchQueries: [{ 
          query: GET_UNITS,
          variables: { copropertyId: input.copropertyId }
        }]
      })
      .pipe(
        map(result => result.data!.createUnit)
      );
  }

  updateUnit(id: string, input: UpdateUnitInput): Observable<Unit> {
    return this.apollo
      .mutate<{ updateUnit: Unit }>({
        mutation: UPDATE_UNIT,
        variables: { id, input }
      })
      .pipe(
        map(result => result.data!.updateUnit)
      );
  }

  deleteUnit(id: string): Observable<boolean> {
    return this.apollo
      .mutate<{ deleteUnit: boolean }>({
        mutation: DELETE_UNIT,
        variables: { id }
      })
      .pipe(
        map(result => result.data!.deleteUnit)
      );
  }
}
