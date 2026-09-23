import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Notification } from 'libs/shared/infra/models/notification.model';
import { translateNotificationMessage } from 'libs/shared/infra/utils/notification-message';
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

  constructor(private translate: TranslateService) {}

  getMessage(message: string): string {
    return translateNotificationMessage(message, this.translate);
  }

  getDuration(dateStr: string): string {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: (this.translate.currentLang || this.translate.defaultLang || 'fr').startsWith('en') ? enUS : fr });
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
