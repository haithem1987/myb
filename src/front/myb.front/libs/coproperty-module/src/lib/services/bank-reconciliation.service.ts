import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ImportSummary {
  statementId: number;
  fileName: string;
  transactionCount: number;
  autoMatched: number;
  manualSuggestions: number;
  unmatched: number;
}

export interface MatchedPayment {
  id: number;
  amount: number;
  paymentDate: string;
  description: string;
}

export interface ReconciliationResult {
  id: number;
  transactionDate: string;
  description: string;
  reference: string;
  amount: number;
  status: 'AutoMatched' | 'ManualSuggestion' | 'Unmatched';
  matchedPayment: MatchedPayment | null;
}

export interface ReconciliationDetail {
  statementId: number;
  fileName: string;
  results: ReconciliationResult[];
}

@Injectable({ providedIn: 'root' })
export class BankReconciliationService {
  private http = inject(HttpClient);
  private readonly base = '/api/bank-statements';

  importStatement(file: File): Observable<ImportSummary> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<ImportSummary>(`${this.base}/import`, form);
  }

  getReconciliation(statementId: number): Observable<ReconciliationDetail> {
    return this.http.get<ReconciliationDetail>(`${this.base}/${statementId}/reconciliation`);
  }

  validate(statementId: number, resultId: number): Observable<ReconciliationResult> {
    return this.http.post<ReconciliationResult>(
      `${this.base}/${statementId}/reconciliation/${resultId}/validate`,
      {}
    );
  }

  getExportUrl(statementId: number): string {
    return `${this.base}/${statementId}/export`;
  }
}
