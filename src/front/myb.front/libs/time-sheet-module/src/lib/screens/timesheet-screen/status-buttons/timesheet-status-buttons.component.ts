import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'myb-front-timesheet-status-buttons',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './timesheet-status-buttons.component.html',
  styleUrls: ['./timesheet-status-buttons.component.css'],
})
export class TimesheetStatusButtonsComponent {
  @Input() selectedProjectsSize: number = 0;
  @Input() isApprovedLoading: boolean = false;
  @Input() isDisApprovedLoading: boolean = false;
  @Output() approveTimesheets = new EventEmitter<void>();
  @Output() disapproveTimesheets = new EventEmitter<void>();

  onApprove(): void {
    this.approveTimesheets.emit();
  }

  onDisapprove(): void {
    this.disapproveTimesheets.emit();
  }
}
