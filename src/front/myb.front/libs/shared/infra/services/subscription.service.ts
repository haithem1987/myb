import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, switchMap, map } from 'rxjs/operators';
import { Subscription } from '../models/subscription.model';
import { environment } from '@env/environment';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  private baseUrl = environment.services.payment.baseUrl;
  private apiPath = environment.services.payment.apiPath;

  // Use BehaviorSubject to store the full list of subscriptions
  private subscriptionsSubject = new BehaviorSubject<Subscription[]>([]);
  subscriptions$ = this.subscriptionsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private keycloakService: KeycloakService
  ) {}

  private get authHeaders(): HttpHeaders {
    const token = this.keycloakService.getToken();
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  // Load all subscriptions from the backend and update the BehaviorSubject
  loadSubscriptions(userId: string): Observable<Subscription[]> {
    return this.http
      .get<Subscription[]>(
        `${this.baseUrl}${this.apiPath}/subscriptions/${userId}`,
        { headers: this.authHeaders }
      )
      .pipe(
        tap((subscriptions) => {
          this.subscriptionsSubject.next(subscriptions); // Emit the full list of subscriptions
        })
      );
  }

  startTrial(userId: string, copropertyId: string): Observable<Subscription> {
    return this.http.post<Subscription>(
      `${this.baseUrl}${this.apiPath}/start-trial`,
      { userId, copropertyId },
      { headers: this.authHeaders }
    );
  }

  getCopropertySubscription(copropertyId: string): Observable<Subscription> {
    return this.http.get<Subscription>(
      `${this.baseUrl}${this.apiPath}/subscriptions/coproperty/${copropertyId}`,
      { headers: this.authHeaders }
    );
  }

  // Unsubscribe from a service and update the BehaviorSubject
  unsubscribe(userId: string, serviceId: number): Observable<void> {
    const url = `${this.baseUrl}${this.apiPath}/unsubscribe/${userId}/${serviceId}`;

    return this.http
      .delete<string>(url, {
        headers: this.authHeaders,
        responseType: 'text' as 'json'
      })
      .pipe(
        switchMap(() => this.loadSubscriptions(userId)),
        map(() => void 0)
      );
  }
}
