import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import {
  GET_ALL_UNITS_BY_SYNDIC,
  GET_UNIT_BY_ID,
  GET_UNITS_BY_COPROPERTY,
} from '../graphql/queries/unit.query';
import {
  CREATE_UNIT,
  UPDATE_UNIT,
  DELETE_UNIT,
} from '../graphql/mutations/unit.mutation';

export interface UnitExtended {
  id?: string;
  copropertyId: string;
  copropertyName?: string;
  unitNumber: string;
  floor?: number;
  unitType?: string;
  description?: string;
  area?: number;
  shares: number;
  isOccupied: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  ownerUnits?: Array<{
    ownerId: string;
    endDate?: Date | null;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class UnitService {
  private apollo = inject(Apollo);

  getAllUnitsBySyndic(managerId?: string): Observable<UnitExtended[]> {
    return this.apollo
      .watchQuery<{ allUnitsBySyndic: UnitExtended[] }>({
        query: GET_ALL_UNITS_BY_SYNDIC,
        variables: { managerId: managerId || undefined },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' },
      })
      .valueChanges.pipe(map((result) => result.data.allUnitsBySyndic));
  }

  getUnitById(id: string): Observable<UnitExtended> {
    return this.apollo
      .query<{ unitById: UnitExtended }>({
        query: GET_UNIT_BY_ID,
        variables: { id },
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data.unitById));
  }

  getUnitsByCoproperty(copropertyId: string): Observable<UnitExtended[]> {
    return this.apollo
      .watchQuery<{ units: UnitExtended[] }>({
        query: GET_UNITS_BY_COPROPERTY,
        variables: { copropertyId },
        fetchPolicy: 'cache-and-network',
        context: { service: 'copropertyService' },
      })
      .valueChanges
      .pipe(map((result) => result.data.units));
  }

  createUnit(unit: UnitExtended): Observable<UnitExtended> {
    return this.apollo
      .mutate<{ createUnit: UnitExtended }>({
        mutation: CREATE_UNIT,
        variables: { item: unit },
        // The mutation returns the created unit and callers reload their list
        // after success. A failed follow-up query must not turn a committed
        // create into a frontend failure.
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.createUnit));
  }

  updateUnit(unit: UnitExtended): Observable<UnitExtended> {
    return this.apollo
      .mutate<{ updateUnit: UnitExtended }>({
        mutation: UPDATE_UNIT,
        variables: { item: unit },
        // The mutation response is authoritative; callers explicitly reload
        // after success.
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.updateUnit));
  }

  deleteUnit(id: string): Observable<boolean> {
    return this.apollo
      .mutate<{ deleteUnit: boolean }>({
        mutation: DELETE_UNIT,
        variables: { id },
        // Callers reload only after this mutation has returned success.
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.deleteUnit));
  }
}
