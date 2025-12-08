import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { ToastService } from './toast.service';
import { BehaviorSubject } from 'rxjs';
import { Notification } from '../models/notification.model';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private hubConnection: signalR.HubConnection | null = null;

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
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
      .withUrl('http://localhost:5040/notificationhub', {
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
    console.log('Notification envoyée au user >>>>>>> ', message);
    this.http
      .post('http://localhost:5040/api/Notifications', {
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
      .get<Notification[]>(`http://localhost:5040/api/Notifications/${userId}`)
      .subscribe({
        next: (notifications) => this.notificationsSubject.next(notifications),
        error: (err) => console.error('Failed to fetch notifications', err),
      });
  }
}
