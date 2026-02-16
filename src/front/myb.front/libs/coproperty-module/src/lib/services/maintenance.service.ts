import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import {
  GET_ALL_MAINTENANCE_REQUESTS,
  GET_MAINTENANCE_REQUEST_BY_ID,
  GET_MAINTENANCE_BY_COPROPERTY,
  GET_MAINTENANCE_BY_STATUS,
} from '../graphql/queries/maintenance.query';
import {
  CREATE_MAINTENANCE_REQUEST,
  UPDATE_MAINTENANCE_REQUEST,
  DELETE_MAINTENANCE_REQUEST,
  UPDATE_MAINTENANCE_STATUS,
} from '../graphql/mutations/maintenance.mutation';

export interface MaintenanceRequestExtended {
  id?: string;
  copropertyId: string;
  unitId?: string;
  unitNumber?: string;
  title: string;
  description: string;
  category: 'PLUMBING' | 'ELECTRICAL' | 'HEATING' | 'CLEANING' | 'SECURITY' | 'STRUCTURAL' | 'OTHER';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  requestedBy: string;
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: Date;
  completedDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class MaintenanceService {
  private apollo = inject(Apollo);

  getAllMaintenanceRequests(): Observable<MaintenanceRequestExtended[]> {
    return this.apollo
      .query<{ allMaintenanceRequests: MaintenanceRequestExtended[] }>({
        query: GET_ALL_MAINTENANCE_REQUESTS,
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data.allMaintenanceRequests));
  }

  getMaintenanceRequestById(id: string): Observable<MaintenanceRequestExtended> {
    return this.apollo
      .query<{ maintenanceRequestById: MaintenanceRequestExtended }>({
        query: GET_MAINTENANCE_REQUEST_BY_ID,
        variables: { id },
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data.maintenanceRequestById));
  }

  getMaintenanceByCoproperty(copropertyId: string): Observable<MaintenanceRequestExtended[]> {
    return this.apollo
      .query<{ maintenanceRequests: MaintenanceRequestExtended[] }>({
        query: GET_MAINTENANCE_BY_COPROPERTY,
        variables: { copropertyId },
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data.maintenanceRequests));
  }

  getMaintenanceByStatus(copropertyId: string, status: string): Observable<MaintenanceRequestExtended[]> {
    return this.apollo
      .query<{ maintenanceByStatus: MaintenanceRequestExtended[] }>({
        query: GET_MAINTENANCE_BY_STATUS,
        variables: { copropertyId, status },
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data.maintenanceByStatus));
  }

  createMaintenanceRequest(request: MaintenanceRequestExtended): Observable<MaintenanceRequestExtended> {
    return this.apollo
      .mutate<{ createMaintenanceRequest: MaintenanceRequestExtended }>({
        mutation: CREATE_MAINTENANCE_REQUEST,
        variables: { item: request },
        refetchQueries: [{ query: GET_MAINTENANCE_BY_COPROPERTY, variables: { copropertyId: request.copropertyId } }],
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.createMaintenanceRequest));
  }

  updateMaintenanceRequest(request: MaintenanceRequestExtended): Observable<MaintenanceRequestExtended> {
    return this.apollo
      .mutate<{ updateMaintenanceRequest: MaintenanceRequestExtended }>({
        mutation: UPDATE_MAINTENANCE_REQUEST,
        variables: { item: request },
        refetchQueries: [{ query: GET_MAINTENANCE_BY_COPROPERTY, variables: { copropertyId: request.copropertyId } }],
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.updateMaintenanceRequest));
  }

  deleteMaintenanceRequest(id: string): Observable<boolean> {
    return this.apollo
      .mutate<{ deleteMaintenanceRequest: boolean }>({
        mutation: DELETE_MAINTENANCE_REQUEST,
        variables: { id },
        refetchQueries: [{ query: GET_ALL_MAINTENANCE_REQUESTS }],
        awaitRefetchQueries: true,
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.deleteMaintenanceRequest));
  }

  updateMaintenanceStatus(id: string, status: string): Observable<MaintenanceRequestExtended> {
    return this.apollo
      .mutate<{ updateMaintenanceStatus: MaintenanceRequestExtended }>({
        mutation: UPDATE_MAINTENANCE_STATUS,
        variables: { id, status },
        refetchQueries: [
          { query: GET_ALL_MAINTENANCE_REQUESTS },
          { query: GET_MAINTENANCE_REQUEST_BY_ID, variables: { id } }
        ],
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.updateMaintenanceStatus));
  }
}
