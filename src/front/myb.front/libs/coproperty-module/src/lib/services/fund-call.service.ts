import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import {
  GET_FUND_CALLS_BY_COPROPERTY,
  GET_ALL_FUND_CALLS,
  GET_FUND_CALL_BY_ID,
} from '../graphql/queries/fund-call.query';
import {
  CREATE_FUND_CALL,
  UPDATE_FUND_CALL,
  UPDATE_FUND_CALL_STATUS,
  ADD_FUND_CALL_PAYMENT,
  DELETE_FUND_CALL,
  GENERATE_INVOICES_FROM_FUND_CALL,
} from '../graphql/mutations/fund-call.mutation';
import {
  FundCall,
  FundCallPayment,
  CreateFundCallInput,
  UpdateFundCallInput,
  AddFundCallPaymentInput,
} from '../models/fund-call.model';

export interface FundCallExtended extends FundCall {
  copropertyName?: string;
}

/** Filters accepted by the fund-calls list query */
export interface FundCallFilters {
  ownerId?: string;
  year?: number;
}

@Injectable({
  providedIn: 'root',
})
export class FundCallService {
  private apollo = inject(Apollo);

  getAllFundCalls(): Observable<FundCallExtended[]> {
    return this.apollo
      .query<{ allFundCalls: FundCallExtended[] }>({
        query: GET_ALL_FUND_CALLS,
        fetchPolicy: 'no-cache',
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data.allFundCalls));
  }

  getFundCallsByCoproperty(
    copropertyId: string,
    filters: FundCallFilters = {}
  ): Observable<FundCallExtended[]> {
    return this.apollo
      .query<{ fundCallsByCoproperty: FundCallExtended[] }>({
        query: GET_FUND_CALLS_BY_COPROPERTY,
        variables: {
          copropertyId,
          ownerId: filters.ownerId ?? null,
          year: filters.year ?? null,
        },
        fetchPolicy: 'network-only',
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data.fundCallsByCoproperty));
  }

  getFundCallById(id: string): Observable<FundCallExtended> {
    return this.apollo
      .query<{ fundCall: FundCallExtended }>({
        query: GET_FUND_CALL_BY_ID,
        variables: { id },
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data.fundCall));
  }

  createFundCall(input: CreateFundCallInput): Observable<FundCallExtended> {
    return this.apollo
      .mutate<{ createFundCall: FundCallExtended }>({
        mutation: CREATE_FUND_CALL,
        variables: { input },
        refetchQueries: [
          {
            query: GET_FUND_CALLS_BY_COPROPERTY,
            variables: { copropertyId: input.copropertyId, ownerId: null, year: null },
          },
        ],
        awaitRefetchQueries: true,
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.createFundCall));
  }

  updateFundCall(id: string, input: CreateFundCallInput): Observable<FundCallExtended> {
    return this.apollo
      .mutate<{ updateFundCall: FundCallExtended }>({
        mutation: UPDATE_FUND_CALL,
        variables: { id, input },
        refetchQueries: [
          { query: GET_FUND_CALL_BY_ID, variables: { id } },
          {
            query: GET_FUND_CALLS_BY_COPROPERTY,
            variables: { copropertyId: input.copropertyId, ownerId: null, year: null },
          },
        ],
        awaitRefetchQueries: true,
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.updateFundCall));
  }

  /** Update only the status of a fund call */
  updateFundCallStatus(id: string, input: UpdateFundCallInput): Observable<FundCallExtended> {
    return this.apollo
      .mutate<{ updateFundCallStatus: FundCallExtended }>({
        mutation: UPDATE_FUND_CALL_STATUS,
        variables: { id, input },
        refetchQueries: [{ query: GET_FUND_CALL_BY_ID, variables: { id } }],
        awaitRefetchQueries: true,
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.updateFundCallStatus));
  }

  /** Add a payment entry (sum, date, justificatif) to a fund call */
  addFundCallPayment(fundCallId: string, input: AddFundCallPaymentInput): Observable<FundCallPayment> {
    return this.apollo
      .mutate<{ addFundCallPayment: FundCallPayment }>({
        mutation: ADD_FUND_CALL_PAYMENT,
        variables: { fundCallId, input },
        refetchQueries: [{ query: GET_FUND_CALL_BY_ID, variables: { id: fundCallId } }],
        awaitRefetchQueries: true,
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.addFundCallPayment));
  }

  deleteFundCall(id: string, copropertyId?: string): Observable<boolean> {
    return this.apollo
      .mutate<{ deleteFundCall: boolean }>({
        mutation: DELETE_FUND_CALL,
        variables: { id },
        refetchQueries: [{ query: GET_ALL_FUND_CALLS }],
        awaitRefetchQueries: true,
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.deleteFundCall));
  }

  generateInvoicesFromFundCall(fundCallId: string): Observable<any[]> {
    return this.apollo
      .mutate<{ generateInvoicesFromFundCall: any[] }>({
        mutation: GENERATE_INVOICES_FROM_FUND_CALL,
        variables: { fundCallId },
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.generateInvoicesFromFundCall));
  }
}
