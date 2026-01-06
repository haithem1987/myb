import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Coproperty, CreateCopropertyInput, UpdateCopropertyInput } from '../models';

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
      managerId
      isActive
      createdAt
      updatedAt
    }
  }
`;

const GET_COPROPERTY = gql`
  query GetCoproperty($id: UUID!) {
    coproperty(id: $id) {
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
  mutation CreateCoproperty($input: CreateCopropertyInput!) {
    createCoproperty(input: $input) {
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
      managerId
      isActive
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_COPROPERTY = gql`
  mutation UpdateCoproperty($id: UUID!, $input: UpdateCopropertyInput!) {
    updateCoproperty(id: $id, input: $input) {
      id
      name
      address
      city
      postalCode
      country
      description
      totalShares
      commonAreas
      isActive
      updatedAt
    }
  }
`;

const DELETE_COPROPERTY = gql`
  mutation DeleteCoproperty($id: UUID!) {
    deleteCoproperty(id: $id)
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
        query: GET_COPROPERTIES
      })
      .valueChanges.pipe(
        map(result => result.data.coproperties)
      );
  }

  getCoproperty(id: string): Observable<Coproperty> {
    return this.apollo
      .watchQuery<{ coproperty: Coproperty }>({
        query: GET_COPROPERTY,
        variables: { id }
      })
      .valueChanges.pipe(
        map(result => result.data.coproperty)
      );
  }

  getCopropertiesByManager(managerId: string): Observable<Coproperty[]> {
    return this.apollo
      .watchQuery<{ copropertiesByManager: Coproperty[] }>({
        query: GET_COPROPERTIES_BY_MANAGER,
        variables: { managerId }
      })
      .valueChanges.pipe(
        map(result => result.data.copropertiesByManager)
      );
  }

  createCoproperty(input: CreateCopropertyInput): Observable<Coproperty> {
    return this.apollo
      .mutate<{ createCoproperty: Coproperty }>({
        mutation: CREATE_COPROPERTY,
        variables: { input },
        refetchQueries: [{ query: GET_COPROPERTIES }]
      })
      .pipe(
        map(result => result.data!.createCoproperty)
      );
  }

  updateCoproperty(id: string, input: UpdateCopropertyInput): Observable<Coproperty> {
    return this.apollo
      .mutate<{ updateCoproperty: Coproperty }>({
        mutation: UPDATE_COPROPERTY,
        variables: { id, input }
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
        refetchQueries: [{ query: GET_COPROPERTIES }]
      })
      .pipe(
        map(result => result.data!.deleteCoproperty)
      );
  }
}
