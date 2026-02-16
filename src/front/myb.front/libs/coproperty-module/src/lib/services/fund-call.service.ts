import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import {
  GET_ALL_FUND_CALLS,
  GET_FUND_CALLS_BY_COPROPERTY,
  GET_FUND_CALL_BY_ID,
} from '../graphql/queries/fund-call.query';
import {
  CREATE_FUND_CALL,
  UPDATE_FUND_CALL,
  DELETE_FUND_CALL,
  GENERATE_INVOICES_FROM_FUND_CALL,
} from '../graphql/mutations/fund-call.mutation';
import { FundCall, CreateFundCallInput } from '../models/fund-call.model';

export interface FundCallExtended extends FundCall {
  copropertyName?: string;
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
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data.allFundCalls));
  }

  getFundCallsByCoproperty(copropertyId: string): Observable<FundCallExtended[]> {
    return this.apollo
      .query<{ fundCallsByCoproperty: FundCallExtended[] }>({
        query: GET_FUND_CALLS_BY_COPROPERTY,
        variables: { copropertyId },
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
          { query: GET_ALL_FUND_CALLS },
          { query: GET_FUND_CALLS_BY_COPROPERTY, variables: { copropertyId: input.copropertyId } }
        ],
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
          { query: GET_ALL_FUND_CALLS },
          { query: GET_FUND_CALL_BY_ID, variables: { id } },
          { query: GET_FUND_CALLS_BY_COPROPERTY, variables: { copropertyId: input.copropertyId } }
        ],
        context: { service: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.updateFundCall));
  }

  deleteFundCall(id: string): Observable<boolean> {
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
