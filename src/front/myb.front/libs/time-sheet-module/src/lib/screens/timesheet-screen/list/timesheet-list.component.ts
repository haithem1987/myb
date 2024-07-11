import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NgbDropdownConfig,
  NgbDropdownModule,
  NgbModal,
  NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Project } from '../../../models/project.model';
import {
  ApprovalStatus,
  TimeUnit,
  Timesheet,
} from '../../../models/timesheet.model';
import { ProjectService } from '../../../services/project.service';
import { TimesheetService } from '../../../services/timesheet.service';
import { TimesheetEditComponent } from '../edit/timesheet-edit.component';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { ToastService } from 'libs/shared/infra/services/toast.service';
import {
  HolidayService,
  ProgressBarComponent,
} from 'libs/shared/shared-ui/src';

@Component({
  selector: 'myb-timesheet-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgbDropdownModule,
    ProgressBarComponent,
    NgbTooltip,
  ],
  providers: [NgbDropdownConfig],
  templateUrl: './timesheet-list.component.html',
  styleUrls: ['./timesheet-list.component.css'],
})
export class TimesheetListComponent implements OnInit {
  projects$: Observable<Project[]> = this.projectService.projects$;
  userId$: Observable<string | null> = this.keycloakService.userId$;
  updatedTimesheets: Timesheet[] = [];
  searchTerm: string = '';
  userId: string | null = '';
  isLoading = true;
  selectedPeriod: 'week' | 'month' = 'week';
  dateRange: {
    weekday: string;
    day: string;
    month: string;
    year: string;
    isToday: boolean;
  }[] = [];
  timesheetQuantities: { [key: string]: number } = {};
  holidays: { [date: string]: string } = {};
  quantityChange: Subject<{
    projectId: number;
    date: { weekday: string; day: string; month: string; year: string };
    quantity: number;
  }> = new Subject();

  constructor(
    private timesheetService: TimesheetService,
    private projectService: ProjectService,
    private keycloakService: KeycloakService,
    private holidayService: HolidayService,
    private toastService: ToastService,
    private modalService: NgbModal,

    config: NgbDropdownConfig
  ) {
    config.placement = 'left-start';
    config.autoClose = true;

    this.quantityChange
      .pipe(debounceTime(300))
      .subscribe(({ projectId, date, quantity }) => {
        const key = `${projectId}-${date.weekday} ${date.day}`;
        this.timesheetQuantities[key] = quantity;
      });
  }

  ngOnInit(): void {
    this.holidayService.getHolidays().subscribe((data) => {
      console.log('holidays', data);
      this.holidays = data;
    });
    this.projects$.subscribe(() => {
      this.refreshView();
    });
    this.userId$.subscribe((userId) => {
      this.userId = userId;
      if (userId) {
        this.timesheetService
          .getTimesheetsByUserId(userId)
          .subscribe((timesheets) => {
            this.updatedTimesheets = timesheets;
            this.populateTimesheetQuantities(timesheets);
            this.isLoading = false;
            this.refreshView();
          });
      }
    });
  }

  trackByDate(index: number, date: { weekday: string; day: string }) {
    return date.weekday + ' ' + date.day;
  }

  trackByProject(index: number, project: Project) {
    return project.id;
  }
  calculateDateRange(): void {
    const today = new Date();
    const todayString = today.toLocaleDateString();

    this.dateRange = [];

    if (this.selectedPeriod === 'week') {
      const startOfWeek = new Date(
        today.setDate(today.getDate() - today.getDay())
      );
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        const currentDateString = currentDate.toLocaleDateString();
        this.dateRange.push({
          weekday: currentDate.toLocaleDateString(undefined, {
            weekday: 'short',
          }),
          day: currentDate.getDate().toString(),
          month: (currentDate.getMonth() + 1).toString(), // Mois numérique (1-12)
          year: currentDate.getFullYear().toString(),
          isToday: currentDateString === todayString,
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
        const currentDateString = currentDate.toLocaleDateString();
        this.dateRange.push({
          weekday: currentDate.toLocaleDateString(undefined, {
            weekday: 'short',
          }),
          day: currentDate.getDate().toString(),
          month: (currentDate.getMonth() + 1).toString(), // Mois numérique (1-12)
          year: currentDate.getFullYear().toString(),
          isToday: currentDateString === todayString,
        });
        startOfMonth.setDate(startOfMonth.getDate() + 1);
      }
    }

    // Log the dateRange array to verify
    console.log('Calculated Date Range:', this.dateRange);
  }

  refreshView(): void {
    this.calculateDateRange();
  }

  getQuantityForDate(projectId: number, date: string): number {
    const key = `${projectId}-${date}`;
    return this.timesheetQuantities[key] || 0;
  }

  onQuantityChange(
    projectId: number,
    date: { weekday: string; day: string; month: string; year: string },
    event: Event
  ): void {
    const inputElement = event.target as HTMLInputElement;
    const quantity = Number(inputElement.value);
    this.quantityChange.next({ projectId, date, quantity });
  }

  setPeriod(period: 'week' | 'month'): void {
    this.selectedPeriod = period;
    this.refreshView();
  }

  populateTimesheetQuantities(timesheets: Timesheet[]): void {
    this.timesheetQuantities = {};
    timesheets.forEach((timesheet) => {
      const date = new Date(timesheet.date || new Date());
      const dateKey = `${timesheet.projectId}-${date.toLocaleDateString(
        undefined,
        {
          weekday: 'short',
        }
      )} ${date.getDate()}`;
      this.timesheetQuantities[dateKey] = timesheet.quantity || 0;
    });
  }

  getTotalQuantitiesForPeriod(period: 'week' | 'month'): number {
    const totalQuantities = this.updatedTimesheets.reduce(
      (total, timesheet) => {
        const timesheetDate = new Date(timesheet.date || new Date());
        const today = new Date();

        if (period === 'week') {
          const startOfWeek = new Date(
            today.setDate(today.getDate() - today.getDay())
          );
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(endOfWeek.getDate() + 6);

          if (timesheetDate >= startOfWeek && timesheetDate <= endOfWeek) {
            return total + (timesheet.quantity || 0);
          }
        } else if (period === 'month') {
          const startOfMonth = new Date(
            today.getFullYear(),
            today.getMonth(),
            1
          );
          const endOfMonth = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0
          );

          if (timesheetDate >= startOfMonth && timesheetDate <= endOfMonth) {
            return total + (timesheet.quantity || 0);
          }
        }
        return total;
      },
      0
    );

    return totalQuantities;
  }

  saveAllChanges(): void {
    const timesheetUpdates: Timesheet[] = [];

    for (const [key, quantity] of Object.entries(this.timesheetQuantities)) {
      const [projectIdStr, dateStr] = key.split('-');
      const projectId = Number(projectIdStr);
      const dateParts = dateStr.split(' ');
      const date = new Date();
      date.setDate(Number(dateParts[1]));

      let timesheet = this.updatedTimesheets.find(
        (t: any) =>
          t.projectId === projectId &&
          new Date(t.date).getDate() === date.getDate()
      );

      if (!timesheet) {
        const newTimesheet: Timesheet = {
          id: 0,
          date,
          workedHours: 0,
          description: '',
          status: ApprovalStatus.PENDING,
          employeeId: 0,
          projectId,
          quantity,
          employeeName: '',
          projectName: '',
          userId: this.userId,
          timeUnit: TimeUnit.DAY,
        };
        this.updatedTimesheets = [...this.updatedTimesheets, newTimesheet];
        timesheet = newTimesheet;
      } else {
        timesheet = { ...timesheet, quantity };
        this.updatedTimesheets = this.updatedTimesheets.map((t) =>
          t.id === timesheet?.id ? timesheet : t
        );
      }

      timesheetUpdates.push(timesheet);
    }

    if (timesheetUpdates.length > 0) {
      this.timesheetService
        .updateMultipleTimesheets(timesheetUpdates)
        .subscribe(() => {
          console.log('updateMultipleTimesheets response');
          this.toastService.show('All changes saved successfully', {
            classname: 'toast-success',
          });
          this.refreshView();
        });
    }
  }

  getTotalQuantityForProject(projectId: number): number {
    let total = 0;
    for (const [key, quantity] of Object.entries(this.timesheetQuantities)) {
      if (key.startsWith(`${projectId}-`)) {
        total += quantity;
      }
    }
    return total;
  }

  // approveTimeSheet(timesheet: Timesheet): void {
  //   const updatedTimesheet = {
  //     ...timesheet,
  //     isApproved: !timesheet.isApproved,
  //   };
  //   this.timesheetService
  //     .update(timesheet.id, updatedTimesheet)
  //     .subscribe(() => {
  //       this.toastService.show(
  //         `Timesheet ${
  //           updatedTimesheet.isApproved ? 'approved' : 'disapproved'
  //         } successfully`,
  //         { classname: 'toast-success' }
  //       );
  //       this.refreshView();
  //     });
  // }

  editTimeSheet(id: number): void {
    const timesheet = this.updatedTimesheets.find((t) => t.id === id);
    if (timesheet) {
      const modalRef = this.modalService.open(TimesheetEditComponent);
      modalRef.componentInstance.timesheet = timesheet;
    }
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
  isPending(project: Project, date: { weekday: string; day: string }): boolean {
    const targetDate = new Date();
    targetDate.setDate(Number(date.day));
    targetDate.setMonth(new Date().getMonth());

    const timesheet = this.updatedTimesheets.find(
      (ts: Timesheet) =>
        ts.projectId === project.id &&
        new Date(ts.date || new Date()).toDateString() ===
          targetDate.toDateString()
    );

    return timesheet ? timesheet.status === ApprovalStatus.PENDING : false;
  }
  handleHoliday(date: {
    weekday: string;
    day: string;
    month: string;
    year: string;
  }): { isHoliday: boolean; name: string } {
    // Ensure month and day are two digits for consistent formatting
    const month = date.month.padStart(2, '0');
    const day = date.day.padStart(2, '0');

    // Construct the date in YYYY-MM-DD format, assuming the time as midday to avoid timezone issues
    const targetDate = new Date(`${date.year}-${month}-${day}T12:00:00Z`);

    // Format the date to match the holiday format (YYYY-MM-DD)
    const formattedDate = targetDate.toISOString().split('T')[0];

    console.log(
      'formattedDate',
      formattedDate,
      !!this.holidays[formattedDate],
      `${date.year}-${month}-${day}`
    );

    // Check if the formatted date is a holiday
    return {
      isHoliday: !!this.holidays[formattedDate],
      name: this.holidays[formattedDate] ?? '',
    };
  }

  // getApprovalStatus(timesheet: Timesheet): {
  //   text: string;
  //   badgeClass: string;
  // } {
  //   return timesheet.isApproved
  //     ? { text: 'Approuvé', badgeClass: 'bg-success' }
  //     : { text: 'En attente', badgeClass: 'bg-warning' };
  // }

  isWeekend(date: { weekday: string; day: string }): boolean {
    return date.weekday === 'Sun' || date.weekday === 'Sat';
  }
}
