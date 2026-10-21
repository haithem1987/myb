import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { KeycloakService } from '@myb-front/auth';

export interface ImportSummary {
  StatementId: string;
  FileName: string;
  TransactionCount: number;
  AutoMatched: number;
  ManualSuggestions: number;
  Unmatched: number;
}

export interface StatementListItem {
  Id: string;
  FileName: string;
  Format: string;
  ImportedAt: string;
  TransactionCount: number;
  AutoMatched: number;
  ManualSuggestions: number;
  Unmatched: number;
}

export interface MatchedPayment {
  Id: string;
  Amount: number;
  PaymentDate: string;
  Description: string;
}

export interface BankTransaction {
  Id: string;
  Date: string;
  Amount: number;
  Label: string;
  Reference: string | null;
}

export interface ReconciliationEntry {
  Id: string;
  Status: 0 | 1 | 2; // 0=AutoMatched, 1=ManualSuggestion, 2=Unmatched
  Note: string | null;
  IsManuallyValidated: boolean;
  MatchedPayment: MatchedPayment | null;
  FundCallId: string | null;
  FundCallPaymentId: string | null;
}

export interface FundCallSummary {
  Id: string;
  Description: string;
  Amount: number;
  DueDate: string;
  Status: string;
  OwnerName: string | null;
  CopropertyNameSnapshot: string | null;
}

export interface ReconciliationItem {
  Transaction: BankTransaction;
  Reconciliation: ReconciliationEntry;
}

export interface ReconciliationDetail {
  Id: string;
  FileName: string;
  Items: ReconciliationItem[];
}

@Injectable({ providedIn: 'root' })
export class BankReconciliationService {
  private http = inject(HttpClient);
  private keycloak = inject(KeycloakService);
  private readonly base = '/api/bank-statements';

  private authHeaders(): HttpHeaders {
    const token = this.keycloak.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  listStatements(copropertyId: string): Observable<StatementListItem[]> {
    return this.http.get<StatementListItem[]>(
      `${this.base}?copropertyId=${copropertyId}`,
      { headers: this.authHeaders() }
    );
  }

  importStatement(file: File, copropertyId: string): Observable<ImportSummary> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<ImportSummary>(
      `${this.base}/import?copropertyId=${copropertyId}`,
      form,
      { headers: this.authHeaders() }
    );
  }

  getReconciliation(statementId: string): Observable<ReconciliationDetail> {
    return this.http.get<ReconciliationDetail>(`${this.base}/${statementId}/reconciliation`, { headers: this.authHeaders() });
  }

  validate(statementId: string, reconciliationId: string, fundCallId?: string): Observable<ReconciliationEntry> {
    return this.http.post<ReconciliationEntry>(
      `${this.base}/${statementId}/reconciliation/${reconciliationId}/validate`,
      { FundCallId: fundCallId ?? null },
      { headers: this.authHeaders() }
    );
  }

  getActiveFundCalls(copropertyId: string): Observable<FundCallSummary[]> {
    return this.http.get<FundCallSummary[]>(
      `${this.base}/fund-calls/active?copropertyId=${copropertyId}`,
      { headers: this.authHeaders() }
    );
  }

  deleteStatement(statementId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${statementId}`, { headers: this.authHeaders() });
  }

  getExportUrl(statementId: string): string {
    return `${this.base}/${statementId}/export`;
  }
}
