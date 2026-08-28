import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import { Signalement, CreateSignalementInput, SignalementStatus } from '../models/signalement.model';
import {
  GET_SIGNALEMENTS,
  GET_SYNDIC_SIGNALEMENTS,
  GET_SIGNALEMENTS_BY_STATUS,
  GET_MY_SIGNALEMENTS,
  GET_SIGNALEMENT_BY_ID,
} from '../graphql/queries/signalement.queries';
import {
  CREATE_SIGNALEMENT,
  UPDATE_SIGNALEMENT_STATUS,
  INCREMENT_SIGNALEMENT_VIEWS,
  DELETE_SIGNALEMENT,
} from '../graphql/mutations/signalement.mutations';

@Injectable({ providedIn: 'root' })
export class SignalementService {
  private apollo = inject(Apollo);

  getSignalements(copropertyId: string): Observable<Signalement[]> {
    return this.apollo
      .query<{ signalements: Signalement[] }>({
        query: GET_SIGNALEMENTS,
        variables: { copropertyId },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' },
      })
      .pipe(map((r) => r.data.signalements));
  }

  getSyndicSignalements(managerId?: string): Observable<Signalement[]> {
    return this.apollo
      .query<{ syndicSignalements: Signalement[] }>({
        query: GET_SYNDIC_SIGNALEMENTS,
        variables: { managerId: managerId || undefined },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data.syndicSignalements));
  }

  getSignalementsByStatus(copropertyId: string, status: SignalementStatus): Observable<Signalement[]> {
    return this.apollo
      .query<{ signalementsByStatus: Signalement[] }>({
        query: GET_SIGNALEMENTS_BY_STATUS,
        variables: { copropertyId, status },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' },
      })
      .pipe(map((r) => r.data.signalementsByStatus));
  }

  getMySignalements(userId: string): Observable<Signalement[]> {
    return this.apollo
      .query<{ mySignalements: Signalement[] }>({
        query: GET_MY_SIGNALEMENTS,
        variables: { userId },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' },
      })
      .pipe(map((r) => r.data.mySignalements));
  }

  getSignalementById(id: string): Observable<Signalement> {
    return this.apollo
      .query<{ signalementById: Signalement }>({
        query: GET_SIGNALEMENT_BY_ID,
        variables: { id },
        context: { service: 'copropertyService' },
      })
      .pipe(map((r) => r.data.signalementById));
  }

  createSignalement(input: CreateSignalementInput): Observable<Signalement> {
    return this.apollo
      .mutate<{ createSignalement: Signalement }>({
        mutation: CREATE_SIGNALEMENT,
        variables: { input },
        refetchQueries: [
          { query: GET_SIGNALEMENTS, variables: { copropertyId: input.copropertyId } },
        ],
        context: { service: 'copropertyService' },
      })
      .pipe(map((r) => r.data!.createSignalement));
  }

  updateStatus(id: string, status: SignalementStatus, syndicComment?: string): Observable<Signalement> {
    return this.apollo
      .mutate<{ updateSignalementStatus: Signalement }>({
        mutation: UPDATE_SIGNALEMENT_STATUS,
        variables: { id, status, syndicComment },
        context: { service: 'copropertyService' },
      })
      .pipe(map((r) => r.data!.updateSignalementStatus));
  }

  incrementViews(id: string): Observable<boolean> {
    return this.apollo
      .mutate<{ incrementSignalementViews: boolean }>({
        mutation: INCREMENT_SIGNALEMENT_VIEWS,
        variables: { id },
        context: { service: 'copropertyService' },
      })
      .pipe(map((r) => r.data!.incrementSignalementViews));
  }

  deleteSignalement(id: string): Observable<boolean> {
    return this.apollo
      .mutate<{ deleteSignalement: boolean }>({
        mutation: DELETE_SIGNALEMENT,
        variables: { id },
        context: { service: 'copropertyService' },
      })
      .pipe(map((r) => r.data!.deleteSignalement));
  }
}
