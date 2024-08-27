import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimesheetService } from '../../../services/timesheet.service';
import { Observable } from 'rxjs';
import { Timesheet } from '../../../models/timesheet.model';
import { TimesheetUtilityService } from '../../../services/timesheet-utility.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { TimesheetQuantityInputComponent } from '../../../components/quantity-input/timesheet-quantity-input.component';
import {
  AvatarComponent,
  DateCellComponent,
  ProgressBarComponent,
} from 'libs/shared/shared-ui/src';

interface GroupedTimesheet {
  projectName: string;
  username: string;
  timesheets: Timesheet[];
  projectId: number;
}

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
  timesheets$: Observable<Timesheet[]> | undefined =
    this.timesheetService.timesheetsByManager$;
  dateRange: any[] = [];
  selectedPeriod: 'week' | 'month' = 'week';
  totalPeriod: number = 7;
  managerId: string = '';
  groupedTimesheets: GroupedTimesheet[] = [];

  constructor(
    private timesheetService: TimesheetService,
    private timesheetUtility: TimesheetUtilityService,
    private keycloakService: KeycloakService,
    private translate: TranslateService
  ) {
    this.managerId = this.keycloakService?.getProfile()?.id ?? '';
  }

  ngOnInit(): void {
    this.dateRange = this.timesheetUtility.calculateDateRange(
      this.selectedPeriod,
      new Date()
    );
    this.loadTimesheetsByManagerId();
  }

  loadTimesheetsByManagerId(): void {
    this.timesheetService
      .getTimesheetsByManagerId(this.managerId)
      .subscribe((timesheets) => {
        this.groupedTimesheets = this.groupByProjectAndUsername(timesheets);
      });
  }

  groupByProjectAndUsername(timesheets: Timesheet[]): GroupedTimesheet[] {
    const grouped = timesheets.reduce((acc, timesheet) => {
      const key = `${timesheet.projectName}-${timesheet.username}`;
      if (!acc[key]) {
        acc[key] = {
          projectName: timesheet?.projectName ?? '',
          username: timesheet?.username ?? '',
          projectId: timesheet.projectId,
          timesheets: [],
        };
      }
      acc[key].timesheets.push(timesheet);
      return acc;
    }, {} as { [key: string]: GroupedTimesheet });

    return Object.values(grouped);
  }

  calculateDateRange(): void {
    this.dateRange = this.timesheetUtility.calculateDateRange(
      this.selectedPeriod,
      new Date()
    );
  }

  setPeriod(period: 'week' | 'month'): void {
    this.selectedPeriod = period;
    this.calculateDateRange();
  }

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

  handleHoliday(date: any) {
    // Logic to determine if the date is a holiday
    return { isHoliday: false, name: '' }; // Example structure
  }

  getQuantityForGroupDate(group: GroupedTimesheet, dateString: string): number {
    const timesheet = group.timesheets.find(
      (t: any) => new Date(t.date).toISOString().split('T')[0] === dateString
    );
    return timesheet?.quantity || 0;
  }

  getTotalQuantityForGroup(group: GroupedTimesheet): number {
    return group.timesheets.reduce(
      (total, timesheet) => total + (timesheet.quantity || 0),
      0
    );
  }

  onQuantityChange(projectId: number, date: any, quantity: number): void {
    // Logic to handle quantity changes
  }
}
