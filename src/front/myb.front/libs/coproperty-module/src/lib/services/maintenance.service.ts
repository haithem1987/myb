import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  MaintenanceRequest, 
  CreateMaintenanceInput, 
  UpdateMaintenanceInput 
} from '../models';

const GET_MAINTENANCE_REQUESTS = gql`
  query GetMaintenanceRequests($copropertyId: UUID!) {
    maintenanceRequests(copropertyId: $copropertyId) {
      id
      copropertyId
      unitId
      requestedBy
      title
      description
      category
      priority
      status
      assignedTo
      estimatedCost
      actualCost
      scheduledDate
      completedDate
      createdAt
      updatedAt
    }
  }
`;

const GET_MAINTENANCE_REQUEST = gql`
  query GetMaintenanceRequest($id: UUID!) {
    maintenanceRequest(id: $id) {
      id
      copropertyId
      unitId
      requestedBy
      title
      description
      category
      priority
      status
      assignedTo
      estimatedCost
      actualCost
      scheduledDate
      completedDate
      createdAt
      updatedAt
    }
  }
`;

const GET_MY_MAINTENANCE_REQUESTS = gql`
  query GetMyMaintenanceRequests($userId: UUID!) {
    myMaintenanceRequests(userId: $userId) {
      id
      copropertyId
      unitId
      title
      category
      priority
      status
      scheduledDate
      createdAt
    }
  }
`;

const CREATE_MAINTENANCE_REQUEST = gql`
  mutation CreateMaintenanceRequest($input: CreateMaintenanceInput!) {
    createMaintenanceRequest(input: $input) {
      id
      copropertyId
      unitId
      requestedBy
      title
      description
      category
      priority
      status
      estimatedCost
      scheduledDate
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_MAINTENANCE_REQUEST = gql`
  mutation UpdateMaintenanceRequest($id: UUID!, $input: UpdateMaintenanceInput!) {
    updateMaintenanceRequest(id: $id, input: $input) {
      id
      title
      description
      category
      priority
      status
      estimatedCost
      actualCost
      scheduledDate
      updatedAt
    }
  }
`;

const ASSIGN_MAINTENANCE = gql`
  mutation AssignMaintenance($id: UUID!, $technicianId: UUID!) {
    assignMaintenance(id: $id, technicianId: $technicianId) {
      id
      assignedTo
      status
      updatedAt
    }
  }
`;

const COMPLETE_MAINTENANCE_REQUEST = gql`
  mutation CompleteMaintenanceRequest($id: UUID!, $actualCost: Decimal) {
    completeMaintenanceRequest(id: $id, actualCost: $actualCost) {
      id
      status
      actualCost
      completedDate
      updatedAt
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  constructor(private apollo: Apollo) {}

  getMaintenanceRequests(copropertyId: string): Observable<MaintenanceRequest[]> {
    return this.apollo
      .watchQuery<{ maintenanceRequests: MaintenanceRequest[] }>({
        query: GET_MAINTENANCE_REQUESTS,
        variables: { copropertyId }
      })
      .valueChanges.pipe(
        map(result => result.data.maintenanceRequests)
      );
  }

  getMaintenanceRequest(id: string): Observable<MaintenanceRequest> {
    return this.apollo
      .watchQuery<{ maintenanceRequest: MaintenanceRequest }>({
        query: GET_MAINTENANCE_REQUEST,
        variables: { id }
      })
      .valueChanges.pipe(
        map(result => result.data.maintenanceRequest)
      );
  }

  getMyMaintenanceRequests(userId: string): Observable<MaintenanceRequest[]> {
    return this.apollo
      .watchQuery<{ myMaintenanceRequests: MaintenanceRequest[] }>({
        query: GET_MY_MAINTENANCE_REQUESTS,
        variables: { userId }
      })
      .valueChanges.pipe(
        map(result => result.data.myMaintenanceRequests)
      );
  }

  createMaintenanceRequest(input: CreateMaintenanceInput): Observable<MaintenanceRequest> {
    return this.apollo
      .mutate<{ createMaintenanceRequest: MaintenanceRequest }>({
        mutation: CREATE_MAINTENANCE_REQUEST,
        variables: { input },
        refetchQueries: [{ 
          query: GET_MAINTENANCE_REQUESTS,
          variables: { copropertyId: input.copropertyId }
        }]
      })
      .pipe(
        map(result => result.data!.createMaintenanceRequest)
      );
  }

  updateMaintenanceRequest(id: string, input: UpdateMaintenanceInput): Observable<MaintenanceRequest> {
    return this.apollo
      .mutate<{ updateMaintenanceRequest: MaintenanceRequest }>({
        mutation: UPDATE_MAINTENANCE_REQUEST,
        variables: { id, input }
      })
      .pipe(
        map(result => result.data!.updateMaintenanceRequest)
      );
  }

  assignMaintenance(id: string, technicianId: string): Observable<MaintenanceRequest> {
    return this.apollo
      .mutate<{ assignMaintenance: MaintenanceRequest }>({
        mutation: ASSIGN_MAINTENANCE,
        variables: { id, technicianId }
      })
      .pipe(
        map(result => result.data!.assignMaintenance)
      );
  }

  completeMaintenanceRequest(id: string, actualCost?: number): Observable<MaintenanceRequest> {
    return this.apollo
      .mutate<{ completeMaintenanceRequest: MaintenanceRequest }>({
        mutation: COMPLETE_MAINTENANCE_REQUEST,
        variables: { id, actualCost }
      })
      .pipe(
        map(result => result.data!.completeMaintenanceRequest)
      );
  }
}
