import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { ToastService } from './toast.service';
import { BehaviorSubject, map } from 'rxjs';
import { Notification } from '../models/notification.model';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private hubConnection: signalR.HubConnection | null = null;
  private readonly apiUrl = 'http://localhost:8085';

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.notifications$.pipe(
    map(notifications => notifications.filter(n => !n.isRead).length)
  );

  constructor(
    private http: HttpClient,
    private keycloakService: KeycloakService,
    private toastService: ToastService
  ) {}
  public async startConnection(): Promise<void> {
    await this.keycloakService.updateToken();
    const token = (await this.keycloakService.getToken()) || '';
    console.log('startConnection', this.keycloakService);
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.apiUrl}/notificationhub`, {
        accessTokenFactory: () => token,
        withCredentials: false,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('SignalR Connected'))
      .catch((err) => console.error('SignalR error', err));

    this.hubConnection.on('ReceiveNotification', (message: string) => {
      console.log('message', message);
      this.toastService.show(message, {
        classname: 'toast-success',
      });
      this.getNotificationsByUserId(
        this.keycloakService.getProfile()?.id || ''
      );
    });
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
