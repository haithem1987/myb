import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { formatDistanceToNow } from 'date-fns';
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
  getDuration(dateStr: string): string {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  }
}
