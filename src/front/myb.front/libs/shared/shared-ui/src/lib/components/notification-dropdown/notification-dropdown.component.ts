import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Notification } from 'libs/shared/infra/models/notification.model';
@Component({
  selector: 'myb-front-notification-dropdown',
  standalone: true,
  imports: [CommonModule, NgbDropdownModule, TranslateModule],
  templateUrl: './notification-dropdown.component.html',
  styleUrl: './notification-dropdown.component.css',
})
export class NotificationDropdownComponent {
  @Input() notifications: Notification[] = [];
  @Input() unreadCount = 0;
  @Output() markAsRead = new EventEmitter<string>();
  @Output() markAllAsRead = new EventEmitter<void>();

  getDuration(dateStr: string): string {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: fr });
  }

  onNotificationClick(notification: Notification): void {
    if (!notification.isRead) {
      this.markAsRead.emit(notification.id);
    }
  }

  onMarkAllAsRead(): void {
    this.markAllAsRead.emit();
  }
}
