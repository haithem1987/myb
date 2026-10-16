import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Inject, Injectable, Optional } from '@angular/core';
import { Observable, from, switchMap } from 'rxjs';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { ENVIRONMENT } from 'libs/auth/src/lib/environment.token';

export interface CommunicationLogDto {
  id: string;
  senderId?: string;
  senderType: 'user' | 'system' | 'service';
  recipientId: string;
  recipientEmail?: string;
  copropertyId?: string;
  channel: 'InApp' | 'Push' | 'Email';
  subject: string;
  body?: string;
  status: 'Pending' | 'Sent' | 'Delivered' | 'Failed' | 'Read';
  failureReason?: string;
  eventType?: string;
  campaignId?: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface CampaignDto {
  id: string;
  name: string;
  description?: string;
  copropertyId?: string;
  createdBy: string;
  status: 'Draft' | 'Scheduled' | 'Running' | 'Completed' | 'Cancelled';
  channels: string[];
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface CommunicationStats {
  total: number;
  byChannel: { inApp: number; push: number; email: number };
  byStatus: { sent: number; delivered: number; failed: number; read: number };
}

export interface LogFilter {
  copropertyId?: string;
  channel?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface CampaignFilter {
  copropertyId?: string;
  status?: string;
  page?: number;
  size?: number;
}

export interface CreateCampaignDto {
  name: string;
  description?: string;
  copropertyId?: string;
  channels: string[];
  targetCriteria: { mode: 'all' | 'managers_only' };
  message: string;
  subject?: string;
}

@Injectable({ providedIn: 'root' })
export class CommunicationService {
  private readonly apiUrl: string;

  constructor(
    private http: HttpClient,
    private keycloakService: KeycloakService,
    @Optional() @Inject(ENVIRONMENT) private environment: any
  ) {
    this.apiUrl = this.environment?.services?.notification?.baseUrl ?? 'http://localhost:8085';
  }

  getLogs(filter: LogFilter = {}): Observable<PagedResult<CommunicationLogDto>> {
    return this.authenticatedRequest(headers => {
      let params = new HttpParams();
      if (filter.copropertyId) params = params.set('copropertyId', filter.copropertyId);
      if (filter.channel) params = params.set('channel', filter.channel);
      if (filter.status) params = params.set('status', filter.status);
      if (filter.from) params = params.set('from', filter.from);
      if (filter.to) params = params.set('to', filter.to);
      if (filter.page != null) params = params.set('page', String(filter.page));
      if (filter.size != null) params = params.set('size', String(filter.size));
      return this.http.get<PagedResult<CommunicationLogDto>>(`${this.apiUrl}/api/communication/logs`, { headers, params });
    });
  }

  getLog(id: string): Observable<CommunicationLogDto> {
    return this.authenticatedRequest(headers =>
      this.http.get<CommunicationLogDto>(`${this.apiUrl}/api/communication/logs/${id}`, { headers })
    );
  }

  getStats(copropertyId?: string): Observable<CommunicationStats> {
    return this.authenticatedRequest(headers => {
      let params = new HttpParams();
      if (copropertyId) params = params.set('copropertyId', copropertyId);
      return this.http.get<CommunicationStats>(`${this.apiUrl}/api/communication/stats`, { headers, params });
    });
  }

  getCampaigns(filter: CampaignFilter = {}): Observable<PagedResult<CampaignDto>> {
    return this.authenticatedRequest(headers => {
      let params = new HttpParams();
      if (filter.copropertyId) params = params.set('copropertyId', filter.copropertyId);
      if (filter.status) params = params.set('status', filter.status);
      if (filter.page != null) params = params.set('page', String(filter.page));
      if (filter.size != null) params = params.set('size', String(filter.size));
      return this.http.get<PagedResult<CampaignDto>>(`${this.apiUrl}/api/communication/campaigns`, { headers, params });
    });
  }

  getCampaign(id: string): Observable<CampaignDto> {
    return this.authenticatedRequest(headers =>
      this.http.get<CampaignDto>(`${this.apiUrl}/api/communication/campaigns/${id}`, { headers })
    );
  }

  createCampaign(dto: CreateCampaignDto): Observable<CampaignDto> {
    return this.authenticatedRequest(headers =>
      this.http.post<CampaignDto>(`${this.apiUrl}/api/communication/campaigns`, dto, { headers })
    );
  }

  startCampaign(id: string): Observable<void> {
    return this.authenticatedRequest(headers =>
      this.http.post<void>(`${this.apiUrl}/api/communication/campaigns/${id}/start`, {}, { headers })
    );
  }

  cancelCampaign(id: string): Observable<void> {
    return this.authenticatedRequest(headers =>
      this.http.post<void>(`${this.apiUrl}/api/communication/campaigns/${id}/cancel`, {}, { headers })
    );
  }

  private authenticatedRequest<T>(request: (headers: HttpHeaders) => Observable<T>): Observable<T> {
    return from(this.keycloakService.updateToken()).pipe(
      switchMap(() => {
        const token = this.keycloakService.getToken();
        const headers = token
          ? new HttpHeaders({ Authorization: `Bearer ${token}` })
          : new HttpHeaders();
        return request(headers);
      })
    );
  }
}
