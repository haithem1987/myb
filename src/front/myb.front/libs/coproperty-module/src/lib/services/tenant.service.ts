import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import { Tenant, TenantInput } from '../models/tenant.model';

const TENANT_FIELDS = gql`
  fragment TenantFields on Tenant {
    id
    unitId
    firstName
    lastName
    email
    phone
    leaseStartDate
    leaseEndDate
    monthlyRent
    depositAmount
    isActive
    notes
    createdAt
    updatedAt
    unit {
      id
      copropertyId
      copropertyName
      unitNumber
      floor
      area
      shares
      unitType
      isOccupied
    }
  }
`;

const GET_TENANTS = gql`
  ${TENANT_FIELDS}
  query GetTenants($copropertyId: UUID!) {
    tenants(copropertyId: $copropertyId) {
      ...TenantFields
    }
  }
`;

const GET_TENANTS_BY_UNIT = gql`
  ${TENANT_FIELDS}
  query GetTenantsByUnit($unitId: UUID!) {
    tenantsByUnit(unitId: $unitId) {
      ...TenantFields
    }
  }
`;

const CREATE_TENANT = gql`
  ${TENANT_FIELDS}
  mutation CreateTenant($input: TenantInput!) {
    createTenant(input: $input) {
      ...TenantFields
    }
  }
`;

const UPDATE_TENANT = gql`
  ${TENANT_FIELDS}
  mutation UpdateTenant($id: UUID!, $input: TenantInput!) {
    updateTenant(id: $id, input: $input) {
      ...TenantFields
    }
  }
`;

const REMOVE_TENANT = gql`
  mutation RemoveTenant($id: UUID!) {
    removeTenant(id: $id)
  }
`;

@Injectable({
  providedIn: 'root',
})
export class TenantService {
  private apollo = inject(Apollo);

  getTenants(copropertyId: string): Observable<Tenant[]> {
    return this.apollo
      .watchQuery<{ tenants: Tenant[] }>({
        query: GET_TENANTS,
        variables: { copropertyId },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' },
      })
      .valueChanges.pipe(map((result) => result.data.tenants));
  }

  getTenantsByUnit(unitId: string): Observable<Tenant[]> {
    return this.apollo
      .watchQuery<{ tenantsByUnit: Tenant[] }>({
        query: GET_TENANTS_BY_UNIT,
        variables: { unitId },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' },
      })
      .valueChanges.pipe(map((result) => result.data.tenantsByUnit));
  }

  createTenant(input: TenantInput, copropertyId?: string): Observable<Tenant> {
    return this.apollo
      .mutate<{ createTenant: Tenant }>({
        mutation: CREATE_TENANT,
        variables: { input },
        refetchQueries: copropertyId ? [{ query: GET_TENANTS, variables: { copropertyId } }] : [],
        awaitRefetchQueries: true,
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.createTenant));
  }

  updateTenant(id: string, input: TenantInput, copropertyId?: string): Observable<Tenant> {
    return this.apollo
      .mutate<{ updateTenant: Tenant }>({
        mutation: UPDATE_TENANT,
        variables: { id, input },
        refetchQueries: copropertyId ? [{ query: GET_TENANTS, variables: { copropertyId } }] : [],
        awaitRefetchQueries: true,
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.updateTenant));
  }

  removeTenant(id: string, copropertyId?: string): Observable<boolean> {
    return this.apollo
      .mutate<{ removeTenant: boolean }>({
        mutation: REMOVE_TENANT,
        variables: { id },
        refetchQueries: copropertyId ? [{ query: GET_TENANTS, variables: { copropertyId } }] : [],
        awaitRefetchQueries: true,
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.removeTenant));
  }
}
