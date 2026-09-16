import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Optional } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { ToastService } from './toast.service';
import { BehaviorSubject, Subject, map } from 'rxjs';
import { Notification } from '../models/notification.model';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { ENVIRONMENT } from 'libs/auth/src/lib/environment.token';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private hubConnection: signalR.HubConnection | null = null;
  private connectionPromise: Promise<void> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private consistencyRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly apiUrl: string;

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.notifications$.pipe(
    map(notifications => notifications.filter(n => !n.isRead).length)
  );
  private dataChangesSubject = new Subject<void>();
  /** Emits whenever another panel changes data relevant to the signed-in user. */
  public dataChanges$ = this.dataChangesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private keycloakService: KeycloakService,
    private toastService: ToastService,
    @Optional() @Inject(ENVIRONMENT) private environment: any
  ) {
    this.apiUrl = this.environment?.services?.notification?.baseUrl ?? 'http://localhost:8085';
  }
  public async startConnection(): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected ||
        this.hubConnection?.state === signalR.HubConnectionState.Connecting ||
        this.hubConnection?.state === signalR.HubConnectionState.Reconnecting) return;
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = this.connect();
    return this.connectionPromise;
  }

  private async connect(): Promise<void> {
    try {
      await this.keycloakService.updateToken();
      if (!this.keycloakService.getToken()) {
        this.scheduleReconnect();
        return;
      }

      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${this.apiUrl}/notificationhub`, {
          accessTokenFactory: async () => {
            await this.keycloakService.updateToken();
            return this.keycloakService.getToken() || '';
          },
          withCredentials: false,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.hubConnection.on('ReceiveNotification', (message: string) => {
        this.toastService.show(message, {
          classname: 'toast-success',
        });
        this.notifyDataChanged();
        this.getNotificationsByUserId(
          this.keycloakService.getProfile()?.id || ''
        );
      });

      this.hubConnection.onreconnected(() => this.notifyDataChanged());
      this.hubConnection.onclose(() => this.scheduleReconnect());
      await this.hubConnection.start();
      this.clearReconnectTimer();
    } catch (err) {
      console.error('SignalR error', err);
      if (this.hubConnection?.state === signalR.HubConnectionState.Disconnected) {
        this.hubConnection = null;
      }
      this.scheduleReconnect();
    } finally {
      this.connectionPromise = null;
    }
  }

  private notifyDataChanged(): void {
    // Emit immediately for responsive panels, then once more after the mutation's
    // outer transaction has had time to commit. Without this consistency refresh,
    // a fast SignalR delivery can make the only reload observe stale data.
    this.dataChangesSubject.next();
    if (this.consistencyRefreshTimer) clearTimeout(this.consistencyRefreshTimer);
    this.consistencyRefreshTimer = setTimeout(() => {
      this.dataChangesSubject.next();
      this.consistencyRefreshTimer = null;
    }, 1000);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.startConnection();
    }, 5000);
  }

  private clearReconnectTimer(): void {
    if (!this.reconnectTimer) return;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  public sendToUser({ senderId, receiverId, message }: any): void {
    this.http
      .post(`${this.apiUrl}/api/Notifications`, {
        senderId,
        receiverId,
        message,
      })
      .subscribe({
        next: () => console.log('Notification envoyée au manager'),
        error: (err) => console.error('Erreur envoi notification', err),
      });
  }

  public getNotificationsByUserId(userId: string): void {
    this.http
      .get<Notification[]>(`${this.apiUrl}/api/Notifications/${userId}`)
      .subscribe({
        next: (notifications) => this.notificationsSubject.next(notifications),
        error: (err) => console.error('Failed to fetch notifications', err),
      });
  }

  public markAsRead(notificationId: string): void {
    this.http
      .put(`${this.apiUrl}/api/Notifications/${notificationId}/read`, {})
      .subscribe({
        next: () => {
          const updated = this.notificationsSubject.value.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          );
          this.notificationsSubject.next(updated);
        },
        error: (err) => console.error('Failed to mark notification as read', err),
      });
  }

  public markAllAsRead(userId: string): void {
    this.http
      .put(`${this.apiUrl}/api/Notifications/read-all/${userId}`, {})
      .subscribe({
        next: () => {
          const updated = this.notificationsSubject.value.map(n => ({ ...n, isRead: true }));
          this.notificationsSubject.next(updated);
        },
        error: (err) => console.error('Failed to mark all as read', err),
      });
  }
}
