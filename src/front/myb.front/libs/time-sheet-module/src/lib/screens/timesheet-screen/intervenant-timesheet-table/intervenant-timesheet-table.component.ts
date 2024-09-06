import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import {
  AvatarComponent,
  DateCellComponent,
  ProgressBarComponent,
} from 'libs/shared/shared-ui/src';
import { TimesheetQuantityInputComponent } from '../../../components/quantity-input/timesheet-quantity-input.component';
import { ApprovalStatus, Timesheet } from '../../../models/timesheet.model';
import { TimesheetUtilityService } from '../../../services/timesheet-utility.service';
import { TimesheetService } from '../../../services/timesheet.service';
import { GroupedTimesheet } from '../../../models/groupedTiesheet.model';

@Component({
  selector: 'myb-front-intervenant-timesheet-table',
  standalone: true,
  imports: [
    CommonModule,
    TimesheetQuantityInputComponent,
    ProgressBarComponent,
    TranslateModule,
    DateCellComponent,
    AvatarComponent,
  ],
  templateUrl: './intervenant-timesheet-table.component.html',
  styleUrls: ['./intervenant-timesheet-table.component.css'],
})
export class IntervenantTimesheetTableComponent implements OnInit {
  @Input() dateRange: any[] = [];
  @Input() selectedPeriod: 'week' | 'month' = 'week';
  @Input() groupedTimesheets: GroupedTimesheet[] = [];
  @Input() totalPeriod: number = 7;
  @Output() quantityChange = new EventEmitter<{
    projectId: number;
    date: any;
    quantity: number;
  }>();
  @Input() managerId: string = '';
  selectedGroups: Set<number> = new Set<number>();
  @Output() selectedGroupsChange = new EventEmitter<Set<number>>();
  constructor(private timesheetUtility: TimesheetUtilityService) {
    // this.managerId = this.keycloakService?.getProfile()?.id ?? '';
  }

  ngOnInit(): void {}

  trackByDate(index: number, date: any): string {
    return date.dateString;
  }

  trackByTimesheet(index: number, timesheet: GroupedTimesheet): string {
    return `${timesheet.projectName}-${timesheet.username}`;
  }

  isWeekend(date: any): boolean {
    const dayOfWeek = new Date(date.dateString).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  }

  handleHoliday(date: any): { isHoliday: boolean; name: string } {
    // Logic to determine if the date is a holiday
    return { isHoliday: false, name: '' }; // Example structure
  }

  getQuantityForGroupDate(group: GroupedTimesheet, dateString: string): number {
    const timesheet = group.timesheets.find(
      (t: any) => new Date(t.date).toISOString().split('T')[0] === dateString
    );
    return timesheet?.quantity || 0;
  }
  getStatusForGroupDate(
    group: GroupedTimesheet,
    dateString: string
  ): ApprovalStatus {
    const timesheet = group.timesheets.find(
      (t: any) => new Date(t.date).toISOString().split('T')[0] === dateString
    );
    return timesheet?.status || ApprovalStatus.PENDING;
  }

  getTotalQuantityForGroup(group: GroupedTimesheet): number {
    let total = 0;
    let datesChecked = 0;

    for (const timesheet of group.timesheets) {
      if (timesheet.date) {
        const timesheetDate = new Date(timesheet.date);
        const timesheetDateKey = `${timesheetDate.toISOString().split('T')[0]}`;
        const quantity = this.getQuantityForGroupDate(group, timesheetDateKey);
        console.log('quantity>>>>', quantity);
        if (datesChecked >= this.totalPeriod) {
          break;
        }
        if (quantity > 0) {
          total++;
          datesChecked++;
        }
      }
    }
    return total;
  }

  onQuantityChange(projectId: number, date: any, quantity: number): void {
    this.quantityChange.emit({ projectId, date, quantity });
  }
  onGroupSelectChange(groupId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedGroups.add(groupId);
    } else {
      this.selectedGroups.delete(groupId);
    }
    this.selectedGroupsChange.emit(this.selectedGroups);
  }
  isSelected(groupId: number): boolean {
    return this.selectedGroups.has(groupId);
  }
  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.groupedTimesheets.forEach((group) =>
        this.selectedGroups.add(group.id)
      );
    } else {
      this.selectedGroups.clear();
    }
    this.selectedGroupsChange.emit(this.selectedGroups);
  }
}
