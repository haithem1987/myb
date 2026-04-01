import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChargePaymentRequest {
  userId: string;
  chargeDistributionId: string;
  chargeName?: string;
  unitNumber?: string;
  amount: number;
  currency?: string;
  receiptEmail?: string;
  paymentMethod?: string;
}

export interface ChargePaymentResponse {
  clientSecret: string;
  paymentId: number;
  chargeDistributionId: string;
  status: string;
}

export interface PaymentRecord {
  id: number;
  userId: string;
  serviceName: string;
  price: number;
  paymentDate: string;
  paymentStatus: string;
  paymentMethod: string;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentApiService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/payment';

  /**
   * Pay a coproperty charge via the payment service (Stripe).
   * Creates a PaymentIntent and records the payment.
   */
  payCharge(request: ChargePaymentRequest): Observable<ChargePaymentResponse> {
    return this.http.post<ChargePaymentResponse>(
      `${this.baseUrl}/pay-charge`,
      request
    );
  }

  /**
   * Get all charge payments for a specific user.
   */
  getChargePayments(userId: string): Observable<PaymentRecord[]> {
    return this.http.get<PaymentRecord[]>(
      `${this.baseUrl}/charge-payments/${userId}`
    );
  }
}
