import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import {
  GET_ALL_UNITS,
  GET_UNIT_BY_ID,
  GET_UNITS_BY_COPROPERTY,
} from '../graphql/queries/unit.query';
import {
  CREATE_UNIT,
  UPDATE_UNIT,
  DELETE_UNIT,
} from '../graphql/mutations/unit.mutation';

export interface UnitExtended {
  id?: number;
  copropertyId: number;
  unitNumber: string;
  floor: number;
  type: 'APARTMENT' | 'PARKING' | 'CAVE' | 'COMMERCIAL' | 'OTHER';
  area: number;
  shares: number;
  ownerName: string;
  ownerEmail?: string;
  ownerPhone?: string;
  isOccupied: boolean;
  rentedTo?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class UnitService {
  private apollo = inject(Apollo);

  getAllUnits(): Observable<UnitExtended[]> {
    return this.apollo
      .query<{ allUnits: UnitExtended[] }>({
        query: GET_ALL_UNITS,
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data.allUnits));
  }

  getUnitById(id: number): Observable<UnitExtended> {
    return this.apollo
      .query<{ unitById: UnitExtended }>({
        query: GET_UNIT_BY_ID,
        variables: { id },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data.unitById));
  }

  getUnitsByCoproperty(copropertyId: number): Observable<UnitExtended[]> {
    return this.apollo
      .query<{ unitsByCoproperty: UnitExtended[] }>({
        query: GET_UNITS_BY_COPROPERTY,
        variables: { copropertyId },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data.unitsByCoproperty));
  }

  createUnit(unit: UnitExtended): Observable<UnitExtended> {
    return this.apollo
      .mutate<{ createUnit: UnitExtended }>({
        mutation: CREATE_UNIT,
        variables: { item: unit },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.createUnit));
  }

  updateUnit(unit: UnitExtended): Observable<UnitExtended> {
    return this.apollo
      .mutate<{ updateUnit: UnitExtended }>({
        mutation: UPDATE_UNIT,
        variables: { item: unit },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.updateUnit));
  }

  deleteUnit(id: number): Observable<boolean> {
    return this.apollo
      .mutate<{ deleteUnit: boolean }>({
        mutation: DELETE_UNIT,
        variables: { id },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.deleteUnit));
  }
}
