import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Timesheet } from '../../../models/timesheet.model';
import { FormsModule } from '@angular/forms';
import { TimesheetService } from '../../../services/timesheet.service';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';
import {
  NgbDropdownConfig,
  NgbDropdownModule,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { ToastService } from 'libs/shared/infra/services/toast.service';
import { CommonModule } from '@angular/common';
import { TimesheetEditComponent } from '../edit/timesheet-edit.component';

@Component({
  selector: 'myb-timesheet-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbDropdownModule],
  providers: [NgbDropdownConfig],
  templateUrl: './timesheet-list.component.html',
  styleUrls: ['./timesheet-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimesheetListComponent implements OnInit {
  timesheets$: Observable<Timesheet[]> = this.timesheetService.timesheets$;
  userId$: Observable<string | null> = this.keycloakService.userId$;
  updatedTimesheets: Timesheet[] = [];
  private groupedTimesheetsSubject = new BehaviorSubject<{
    [key: string]: Timesheet[];
  }>({});
  groupedTimesheets$ = this.groupedTimesheetsSubject.asObservable();
  searchTerm: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' | '' = '';
  workingHoursPerDay: number = 8;
  selectedPeriod: 'day' | 'week' | 'month' = 'week';
  dateRange: { weekday: string; day: string }[] = [];
  timesheetHours: { [key: string]: number } = {};
  hoursChange: Subject<{
    timesheetId: number;
    date: { weekday: string; day: string };
    hours: number;
  }> = new Subject();

  constructor(
    private router: Router,
    private timesheetService: TimesheetService,
    private keycloakService: KeycloakService,
    private toastService: ToastService,
    private modalService: NgbModal,
    config: NgbDropdownConfig
  ) {
    config.placement = 'left-start';
    config.autoClose = true;

    this.hoursChange
      .pipe(debounceTime(300))
      .subscribe(({ timesheetId, date, hours }) => {
        const key = `${timesheetId}-${date.weekday} ${date.day}`;
        this.timesheetHours[key] = hours;
      });
  }

  ngOnInit(): void {
    this.timesheets$.subscribe((timesheets) => {
      this.updatedTimesheets = timesheets;
      this.refreshView();
    });
    this.userId$.subscribe((userId) => {
      if (!userId) return;
      this.timesheetService
        .getTimesheetsByUserId(userId)
        .pipe(
          tap((timesheets) => {
            this.updatedTimesheets = timesheets;
            this.refreshView();
          })
        )
        .subscribe();
    });
  }

  trackByDate(index: number, date: { weekday: string; day: string }) {
    return date.weekday + ' ' + date.day;
  }

  trackByTimesheet(index: number, timesheet: Timesheet) {
    return timesheet.id;
  }

  groupByPeriod(
    timesheets: Timesheet[],
    period: string
  ): { [key: string]: Timesheet[] } {
    const grouped: { [key: string]: Timesheet[] } = {};
    timesheets.forEach((timesheet) => {
      const date = timesheet.date ? new Date(timesheet.date) : new Date();
      let key!: string;

      if (period === 'day') {
        key = date.toDateString();
      } else if (period === 'week') {
        const startOfWeek = new Date(
          date.setDate(date.getDate() - date.getDay())
        );
        key = startOfWeek.toDateString();
      } else if (period === 'month') {
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(timesheet);
    });
    return grouped;
  }

  calculateDateRange(): void {
    const today = new Date();
    this.dateRange = [];

    if (this.selectedPeriod === 'day') {
      this.dateRange.push({
        weekday: today.toLocaleDateString(undefined, { weekday: 'short' }),
        day: today.getDate().toString(),
      });
    } else if (this.selectedPeriod === 'week') {
      const startOfWeek = new Date(
        today.setDate(today.getDate() - today.getDay())
      );
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        this.dateRange.push({
          weekday: currentDate.toLocaleDateString(undefined, {
            weekday: 'short',
          }),
          day: currentDate.getDate().toString(),
        });
        startOfWeek.setDate(startOfWeek.getDate() + 1);
      }
    } else if (this.selectedPeriod === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const daysInMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      ).getDate();
      for (let i = 0; i < daysInMonth; i++) {
        const currentDate = new Date(startOfMonth);
        this.dateRange.push({
          weekday: currentDate.toLocaleDateString(undefined, {
            weekday: 'short',
          }),
          day: currentDate.getDate().toString(),
        });
        startOfMonth.setDate(startOfMonth.getDate() + 1);
      }
    }
  }

  refreshView(): void {
    this.calculateDateRange();
    const groupedTimesheets = this.groupByPeriod(
      this.updatedTimesheets,
      this.selectedPeriod
    );
    this.groupedTimesheetsSubject.next(groupedTimesheets);
  }

  onPeriodChange(): void {
    this.refreshView();
  }

  getHoursForDate(timesheetId: number, date: string): number {
    const key = `${timesheetId}-${date}`;
    return this.timesheetHours[key] || 0;
  }

  addTimesheet(): void {
    this.router.navigate(['/timesheet/add']);
  }

  approveTimeSheet(timesheet: Timesheet): void {
    const updatedTimesheet = {
      ...timesheet,
      isApproved: !timesheet.isApproved,
    };
    this.timesheetService
      .update(timesheet.id, updatedTimesheet)
      .subscribe(() => {
        this.toastService.show(
          `Timesheet ${
            updatedTimesheet.isApproved ? 'approved' : 'disapproved'
          } successfully`,
          {
            classname: 'toast-success',
          }
        );
        this.refreshView();
      });
  }

  editTimeSheet(id: number): void {
    const timesheet = this.updatedTimesheets.find((t) => t.id === id);
    if (!timesheet) return;

    const modalRef = this.modalService.open(TimesheetEditComponent);
    modalRef.componentInstance.timesheet = timesheet;
  }

  deleteTimeSheet(id: number): void {
    if (confirm('Are you sure you want to delete this timesheet?')) {
      this.timesheetService.delete(id).subscribe(() => {
        this.toastService.show('Timesheet deleted successfully', {
          classname: 'toast-success',
        });
        this.updatedTimesheets = this.updatedTimesheets.filter(
          (t) => t.id !== id
        );
        this.refreshView();
      });
    }
  }

  private sortTimesheets(): void {
    if (!this.sortColumn || this.sortDirection === '') {
      this.updatedTimesheets = [...this.updatedTimesheets];
    } else {
      this.updatedTimesheets.sort((a: any, b: any) => {
        let valueA = a[this.sortColumn];
        let valueB = b[this.sortColumn];

        if (typeof valueA === 'string') {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }

        if (this.sortDirection === 'asc') {
          return valueA > valueB ? 1 : -1;
        } else {
          return valueA < valueB ? 1 : -1;
        }
      });
    }
    this.refreshView();
  }

  getApprovalStatus(timesheet: Timesheet): {
    text: string;
    badgeClass: string;
  } {
    return timesheet.isApproved
      ? { text: 'Approuvé', badgeClass: 'bg-success' }
      : { text: 'En attente', badgeClass: 'bg-warning' };
  }
  isWeekend(date: { weekday: string; day: string }): boolean {
    // console.log('day', date.weekday);
    // const fullDateStr = `${date.weekday} ${date.day}, 2024`; // Adjust the year as necessary
    // const dateObj = new Date(fullDateStr);
    // const dayIndex = dateObj.getDay();
    return date.weekday === 'Sun' || date.weekday === 'Sat'; // 0 = Sunday, 6 = Saturday
  }
  onHoursChange(
    timesheetId: number,
    date: { weekday: string; day: string },
    event: Event
  ): void {
    const inputElement = event.target as HTMLInputElement;
    const hours = Number(inputElement.value);
    this.hoursChange.next({ timesheetId, date, hours });
  }
  setPeriod(period: 'day' | 'week' | 'month'): void {
    this.selectedPeriod = period;
    this.refreshView();
  }
  filterTimesheets(): void {
    // Implement filtering logic
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortTimesheets();
  }
}
