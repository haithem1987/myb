import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NgbDropdownConfig,
  NgbDropdownModule,
  NgbModal,
  NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subject, Subscription } from 'rxjs';
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
  GeneralSettingsService,
  HolidayService,
  LoadingIndicatorComponent,
  ProgressBarComponent,
} from 'libs/shared/shared-ui/src';
import {
  LangChangeEvent,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { TimesheetHeaderComponent } from '../timesheet-header/timesheet-header.component';
import { TimesheetActionButtonsComponent } from '../action-buttons/timesheet-action-buttons.component';
import { TimesheetTableComponent } from '../table/timesheet-table.component';
import { PeriodSelectorComponent } from '../period-selector/period-selector.component';

@Component({
  selector: 'myb-timesheet-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgbDropdownModule,
    ProgressBarComponent,
    LoadingIndicatorComponent,
    TimesheetHeaderComponent,
    TimesheetActionButtonsComponent,
    TimesheetTableComponent,
    PeriodSelectorComponent,
    NgbTooltip,
    TranslateModule,
  ],
  providers: [NgbDropdownConfig],
  templateUrl: './timesheet-list.component.html',
  styleUrls: ['./timesheet-list.component.css'],
})
export class TimesheetListComponent implements OnInit {
  projects$: Observable<Project[]> = this.projectService.activeProjects$;
  userId$: Observable<string | null> = this.keycloakService.userId$;
  updatedTimesheets: Timesheet[] = [];
  searchTerm: string = '';
  userId: string | null = '';
  isLoading = true;
  isSaving = false;
  selectedPeriod: 'week' | 'month' = 'week';
  totalPeriod: number = 7;
  dateRange: {
    dateString: string;
    weekday: string;
    day: string;
    month: string;
    year: string;
    isToday: boolean;
  }[] = [];
  currentDay: Date = new Date();
  timesheetQuantities: { [key: string]: number } = {};
  holidays: { [date: string]: string } = {};
  selectedProjects: Set<number> = new Set<number>();
  quantityChange: Subject<{
    projectId: number;
    date: {
      dateString: string;
      weekday: string;
      day: string;
      month: string;
      year: string;
    };
    quantity: number;
  }> = new Subject();
  private langChangeSubscription!: Subscription;
  private defaultHours: number = 1;
  timeUnit: string = 'Day';
  weekendDays: string[] = [];
  isManager: boolean = false;
  constructor(
    private timesheetService: TimesheetService,
    private projectService: ProjectService,
    private keycloakService: KeycloakService,
    private holidayService: HolidayService,
    private toastService: ToastService,
    private modalService: NgbModal,
    public translate: TranslateService,
    private settingsService: GeneralSettingsService,
    config: NgbDropdownConfig
  ) {
    config.placement = 'left-start';
    config.autoClose = true;
    this.isManager = this.keycloakService.isUserManager();
    this.defaultHours = this.settingsService.getSetting(
      'timesheet',
      'defaultHours'
    );
    this.timeUnit = this.settingsService.getSetting('timesheet', 'timeUnit');
    this.quantityChange
      .pipe(debounceTime(300))
      .subscribe(({ projectId, date, quantity }) => {
        const key = `${projectId}.${date.dateString}`;
        this.timesheetQuantities[key] = quantity;
      });
    this.langChangeSubscription = this.translate.onLangChange.subscribe(
      (event: LangChangeEvent) => {
        console.log('langChangeSubscription', this.updatedTimesheets);
        this.setWeekendDays();
        this.populateTimesheetQuantities(this.updatedTimesheets);
        this.calculateDateRange();
      }
    );
  }

  ngOnInit(): void {
    this.loadHolidays();
    this.loadProjects();
    this.loadTimesheets();
  }

  loadHolidays(): void {
    this.holidayService.getHolidays().subscribe((data) => {
      this.holidays = data;
    });
  }

  loadProjects(): void {
    this.projects$.subscribe((projects) => {
      // this.refreshView();
    });
  }

  loadTimesheets() {
    this.userId$.subscribe((userId) => {
      this.userId = userId;
      if (userId) {
        this.timesheetService
          .getTimesheetsByUserId(userId)
          .subscribe((timesheets) => {
            this.setWeekendDays();
            this.updatedTimesheets = timesheets;
            this.populateTimesheetQuantities(timesheets);
            this.isLoading = false;
            this.refreshView();
          });
      }
    });
  }
  fillSelectedProjects(): void {
    for (const projectId of this.selectedProjects) {
      for (const date of this.dateRange) {
        const key = `${projectId}.${date.dateString}`;
        if (!this.timesheetQuantities[key]) {
          this.timesheetQuantities[key] = this.defaultHours;
        }
      }
    }
  }
  extractPDF(): void {
    const projectIds = Array.from(this.selectedProjects);
    console.log('projectIds', projectIds);
    if (projectIds.length === 0) {
      this.toastService.show('Please select at least one project', {
        classname: 'toast-warning',
      });
      return;
    }

    this.timesheetService.generateTimesheetPdf(projectIds).subscribe({
      next: (pdfBase64: string) => {
        console.log('pdfBase64', pdfBase64);
        const linkSource = `data:application/pdf;base64,${pdfBase64}`;
        const downloadLink = document.createElement('a');
        const now = new Date();
        const fileName = `timesheets_${now
          .toISOString()
          .replace(/[:.-]/g, '_')
          .slice(0, 19)}.pdf`;

        downloadLink.href = linkSource;
        downloadLink.download = fileName;
        downloadLink.click();

        this.toastService.show('PDF generated and downloaded successfully', {
          classname: 'toast-success',
        });
      },
      error: (error) => {
        console.error('Error generating PDF:', error);
        this.toastService.show('Failed to generate PDF', {
          classname: 'toast-danger',
        });
      },
    });
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    this.projects$.subscribe((projects) => {
      if (checked) {
        projects.forEach((project) => this.selectedProjects.add(project.id));
      } else {
        this.selectedProjects.clear();
      }
    });
  }

  onRowSelectChange(projectId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedProjects.add(projectId);
    } else {
      this.selectedProjects.delete(projectId);
    }
  }

  calculateDateRange(): void {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    console.log('todayString', todayString);
    this.dateRange = [];

    if (this.selectedPeriod === 'week') {
      const startOfWeek = new Date(
        today.setDate(today.getDate() - today.getDay())
      );
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        const currentDateString = currentDate.toISOString().split('T')[0];
        this.translate
          .get(
            `WEEKDAY.${currentDate
              .toLocaleDateString(undefined, { weekday: 'short' })
              .toLowerCase()}`
          )
          .subscribe((translatedWeekday) => {
            this.dateRange.push({
              dateString: currentDateString,
              weekday: translatedWeekday,
              day: currentDate.getDate().toString(),
              month: (currentDate.getMonth() + 1).toString(),
              year: currentDate.getFullYear().toString(),
              isToday: currentDateString === todayString,
            });
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
      console.log('startOfMonth', startOfMonth);

      for (let i = 0; i < daysInMonth; i++) {
        const currentDate = new Date(startOfMonth);
        const currentDateString = currentDate.toLocaleDateString('en-CA');
        this.translate
          .get(
            `WEEKDAY.${currentDate
              .toLocaleDateString(undefined, { weekday: 'short' })
              .toLowerCase()}`
          )
          .subscribe((translatedWeekday) => {
            this.dateRange.push({
              dateString: currentDateString,
              weekday: translatedWeekday,
              day: currentDate.getDate().toString(),
              month: (currentDate.getMonth() + 1).toString(),
              year: currentDate.getFullYear().toString(),
              isToday: currentDateString === todayString,
            });
          });
        startOfMonth.setDate(startOfMonth.getDate() + 1);
      }
    }

    console.log('Calculated Date Range:', this.dateRange);
    this.totalPeriod = this.dateRange.length;
  }

  refreshView(): void {
    this.calculateDateRange();
  }

  onQuantityChange(
    projectId: number,
    date: {
      dateString: string;
      weekday: string;
      day: string;
      month: string;
      year: string;
    },
    quantity: number
  ): void {
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
      const dateKey = `${timesheet.projectId}.${
        date.toISOString().split('T')[0]
      }`;
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
    this.isSaving = true;
    const { id, firstName, lastName }: any = this.keycloakService.getProfile();
    const timesheetUpdates: Timesheet[] = [];

    this.projects$.subscribe((projects) => {
      const projectMap = new Map<number, Project>();
      projects.forEach((project) => {
        projectMap.set(project.id, project);
      });

      for (const [key, quantity] of Object.entries(this.timesheetQuantities)) {
        const [projectIdStr, dateString] = key.split('.');
        console.log('dateString', dateString);
        const projectId = Number(projectIdStr);
        const date = new Date(`${dateString}`);
        console.log('date', date);
        let timesheet = this.updatedTimesheets.find(
          (t: any) =>
            t.projectId === projectId &&
            new Date(t.date).toDateString() === date.toDateString()
        );

        const project = projectMap.get(projectId);

        if (!project) {
          continue;
        }

        if (!timesheet) {
          const newTimesheet: Timesheet = {
            id: 0,
            date,
            workedHours: 0,
            description: '',
            status: ApprovalStatus.PENDING,
            projectId,
            quantity,
            username: `${firstName} ${lastName}`,
            projectName: project.projectName,
            userId: id,
            timeUnit: TimeUnit.DAY,
          };
          this.updatedTimesheets = [...this.updatedTimesheets, newTimesheet];
          timesheet = newTimesheet;
        } else {
          timesheet = {
            ...timesheet,
            userId: id,
            username: `${firstName} ${lastName}`,
            quantity,
            projectName: project.projectName,
          };
          this.updatedTimesheets = this.updatedTimesheets.map((t) =>
            t.id === timesheet?.id ? timesheet : t
          );
        }

        timesheetUpdates.push(timesheet);
      }

      if (timesheetUpdates.length > 0) {
        this.timesheetService
          .updateMultipleTimesheets(timesheetUpdates)
          .subscribe({
            next: () => {
              console.log('updateMultipleTimesheets response');
              this.toastService.show('All changes saved successfully', {
                classname: 'toast-success',
              });
              this.refreshView();
              this.isSaving = false;
            },
            error: (error) => {
              console.error('Error saving changes', error);
              this.isSaving = false;
            },
          });
      } else {
        this.isSaving = false;
      }
    });
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
  setWeekendDays(): void {
    this.translate.get('WEEKDAY.weekend').subscribe((weekendDays: string[]) => {
      this.weekendDays = weekendDays;
    });
  }
}
