import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Intervention,
  CreateInterventionInput,
  UpdateInterventionInput,
  InterventionStatus,
} from '../models/intervention.model';
import {
  GET_INTERVENTIONS,
  GET_INTERVENTIONS_BY_COPROPERTY,
  GET_INTERVENTION_BY_ID,
  GET_INTERVENTIONS_BY_STATUS,
} from '../graphql/queries/intervention.query';
import {
  CREATE_INTERVENTION,
  UPDATE_INTERVENTION,
  DELETE_INTERVENTION,
  UPDATE_INTERVENTION_STATUS,
  ASSIGN_INTERVENTION,
  COMPLETE_INTERVENTION,
} from '../graphql/mutations/intervention.mutation';

@Injectable({ providedIn: 'root' })
export class InterventionService {
  constructor(private apollo: Apollo) {}

  getAllInterventions(): Observable<Intervention[]> {
    return this.apollo
      .query<{ interventions: Intervention[] }>({
        query: GET_INTERVENTIONS,
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data.interventions));
  }

  getInterventionsByCoproperty(copropertyId: string): Observable<Intervention[]> {
    return this.apollo
      .query<{ interventionsByCoproperty: Intervention[] }>({
        query: GET_INTERVENTIONS_BY_COPROPERTY,
        variables: { copropertyId },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data.interventionsByCoproperty));
  }

  getInterventionById(id: string): Observable<Intervention> {
    return this.apollo
      .query<{ interventionById: Intervention }>({
        query: GET_INTERVENTION_BY_ID,
        variables: { id },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data.interventionById));
  }

  getInterventionsByStatus(copropertyId: string, status: InterventionStatus): Observable<Intervention[]> {
    return this.apollo
      .query<{ interventionsByStatus: Intervention[] }>({
        query: GET_INTERVENTIONS_BY_STATUS,
        variables: { copropertyId, status },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data.interventionsByStatus));
  }

  createIntervention(input: CreateInterventionInput): Observable<Intervention> {
    return this.apollo
      .mutate<{ createIntervention: Intervention }>({
        mutation: CREATE_INTERVENTION,
        variables: { input },
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.createIntervention));
  }

  updateIntervention(input: UpdateInterventionInput): Observable<Intervention> {
    return this.apollo
      .mutate<{ updateIntervention: Intervention }>({
        mutation: UPDATE_INTERVENTION,
        variables: { input },
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.updateIntervention));
  }

  deleteIntervention(id: string): Observable<boolean> {
    return this.apollo
      .mutate<{ deleteIntervention: boolean }>({
        mutation: DELETE_INTERVENTION,
        variables: { id },
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.deleteIntervention));
  }

  updateInterventionStatus(id: string, status: InterventionStatus): Observable<Intervention> {
    return this.apollo
      .mutate<{ updateInterventionStatus: Intervention }>({
        mutation: UPDATE_INTERVENTION_STATUS,
        variables: { id, status },
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.updateInterventionStatus));
  }

  assignIntervention(id: string, providerName: string, providerPhone?: string, providerEmail?: string): Observable<Intervention> {
    return this.apollo
      .mutate<{ assignIntervention: Intervention }>({
        mutation: ASSIGN_INTERVENTION,
        variables: { id, providerName, providerPhone, providerEmail },
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.assignIntervention));
  }

  completeIntervention(id: string, actualCost?: number, resolution?: string): Observable<Intervention> {
    return this.apollo
      .mutate<{ completeIntervention: Intervention }>({
        mutation: COMPLETE_INTERVENTION,
        variables: { id, actualCost, resolution },
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.completeIntervention));
  }
}
