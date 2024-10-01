import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PeriodSelectorComponent } from '../period-selector/period-selector.component';
import { TimesheetActionButtonsComponent } from '../action-buttons/timesheet-action-buttons.component';
import { IntervenantTimesheetTableComponent } from '../intervenant-timesheet-table/intervenant-timesheet-table.component';
import { TimesheetUtilityService } from '../../../services/timesheet-utility.service';
import { TranslateService } from '@ngx-translate/core';
import { TimesheetService } from '../../../services/timesheet.service';
import { GroupedTimesheet } from '../../../models/groupedTiesheet.model';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { TimesheetStatusButtonsComponent } from '../status-buttons/timesheet-status-buttons.component';
import { ApprovalStatus, Timesheet } from '../../../models/timesheet.model';
import { ToastService } from 'libs/shared/infra/services/toast.service';

@Component({
  selector: 'myb-front-intervenant-timesheet',
  standalone: true,
  imports: [
    CommonModule,
    PeriodSelectorComponent,
    TimesheetActionButtonsComponent,
    IntervenantTimesheetTableComponent,
    TimesheetStatusButtonsComponent,
  ],
  templateUrl: './intervenant-timesheet.component.html',
  styleUrls: ['./intervenant-timesheet.component.css'],
})
export class IntervenantTimesheetComponent implements OnInit {
  selectedPeriod: 'week' | 'month' = 'week';
  isSaving = false;
  isApprovedLoading: boolean = false;
  isDisApprovedLoading: boolean = false;
  currentDay: Date = new Date();
  totalPeriod: number = 7;
  groupedTimesheets: GroupedTimesheet[] = [];
  managerId: string = '';
  dateRange: any[] = [];
  selectedGroups: Set<number> = new Set<number>();

  constructor(
    private timesheetUtility: TimesheetUtilityService,
    private timesheetService: TimesheetService,
    private keycloakService: KeycloakService,
    private translate: TranslateService,
    private toastService: ToastService
  ) {
    this.managerId = this.keycloakService?.getProfile()?.id ?? '';
  }

  ngOnInit(): void {
    this.dateRange = this.timesheetUtility.calculateDateRange(
      this.selectedPeriod,
      new Date()
    );

    this.timesheetService.timesheetsByManager$.subscribe((timesheets) => {
      console.table(timesheets);
      this.groupedTimesheets =
        this.timesheetUtility.groupByProjectAndUsername(timesheets);
      this.totalPeriod = this.calculateTotalPeriod();
    });

    this.loadTimesheetsByManagerId();
  }

  loadTimesheetsByManagerId(): void {
    this.timesheetService
      .getTimesheetsByManagerId(this.managerId)
      .subscribe((timesheets) => {
        this.groupedTimesheets =
          this.timesheetUtility.groupByProjectAndUsername(timesheets);
        this.totalPeriod = this.calculateTotalPeriod();
      });
  }

  setPeriod(period: 'week' | 'month'): void {
    this.selectedPeriod = period;
    this.dateRange = this.timesheetUtility.calculateDateRange(
      this.selectedPeriod,
      new Date()
    );
  }

  calculateTotalPeriod(): number {
    const dateRange = this.timesheetUtility.calculateDateRange(
      this.selectedPeriod,
      new Date()
    );
    return dateRange.length;
  }

  getTotalQuantitiesForPeriod(period: 'week' | 'month'): number {
    return this.groupedTimesheets.reduce((total, group) => {
      return (
        total +
        group.timesheets.reduce((groupTotal, timesheet) => {
          const timesheetDate = timesheet.date
            ? new Date(timesheet.date)
            : null;
          const today = new Date();

          if (period === 'week') {
            const startOfWeek = new Date(
              today.setDate(today.getDate() - today.getDay())
            );
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);

            if (
              timesheetDate &&
              timesheetDate >= startOfWeek &&
              timesheetDate <= endOfWeek
            ) {
              return groupTotal + (timesheet.quantity || 0);
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

            if (
              timesheetDate &&
              timesheetDate >= startOfMonth &&
              timesheetDate <= endOfMonth
            ) {
              return groupTotal + (timesheet.quantity || 0);
            }
          }

          return groupTotal;
        }, 0)
      );
    }, 0);
  }

  onQuantityChange(projectId: number, date: any, quantity: number): void {
    const group = this.groupedTimesheets.find((g) => g.projectId === projectId);
    if (group) {
      const timesheet = group.timesheets.find((t) => {
        const timesheetDate = t.date
          ? new Date(t.date).toISOString().split('T')[0]
          : null;
        return timesheetDate === date.dateString;
      });

      if (timesheet) {
        timesheet.quantity = quantity;
      }
    }
  }
  approveSelectedTimesheets(): void {
    const selectedTimesheets: Timesheet[] = [];

    this.groupedTimesheets.forEach((group) => {
      if (this.selectedGroups.has(group.id)) {
        group.timesheets.forEach((timesheet) => {
          const updatedTimesheet = {
            ...timesheet,
            status: ApprovalStatus.APPROVED,
          };
          selectedTimesheets.push(updatedTimesheet);
        });
      }
    });

    if (selectedTimesheets.length > 0) {
      this.isApprovedLoading = true;
      this.timesheetService
        .updateMultipleTimesheets(selectedTimesheets, 'OtherTimesheets')
        .subscribe({
          next: (updatedTimesheets) => {
            this.translate
              .get('TOAST.TIMESHEETS_APPROVED_SUCCESS')
              .subscribe((message) => {
                this.toastService.show(message, {
                  classname: 'toast-success',
                });
              });
            this.isApprovedLoading = false;
            this.selectedGroups.clear();
          },
          error: (error) => {
            this.translate
              .get('TOAST.TIMESHEETS_APPROVE_ERROR')
              .subscribe((message) => {
                this.toastService.show(message, {
                  classname: 'toast-danger',
                });
              });
            this.isApprovedLoading = false;
          },
        });
    } else {
      this.translate
        .get('TOAST.NO_TIMESHEETS_SELECTED')
        .subscribe((message) => {
          this.toastService.show(message, {
            classname: 'toast-warning',
          });
        });
    }
  }

  disapproveSelectedTimesheets(): void {
    const selectedTimesheets: Timesheet[] = [];

    this.groupedTimesheets.forEach((group) => {
      if (this.selectedGroups.has(group.id)) {
        group.timesheets.forEach((timesheet) => {
          const updatedTimesheet = {
            ...timesheet,
            status: ApprovalStatus.REJECTED,
          };
          selectedTimesheets.push(updatedTimesheet);
        });
      }
    });

    if (selectedTimesheets.length > 0) {
      this.isDisApprovedLoading = true;
      this.timesheetService
        .updateMultipleTimesheets(selectedTimesheets, 'OtherTimesheets')
        .subscribe({
          next: (updatedTimesheets) => {
            this.translate
              .get('TOAST.TIMESHEETS_DISAPPROVED_SUCCESS')
              .subscribe((message) => {
                this.toastService.show(message, {
                  classname: 'toast-success',
                });
              });
            this.isDisApprovedLoading = false;
            this.selectedGroups.clear();
          },
          error: (error) => {
            this.translate
              .get('TOAST.TIMESHEETS_DISAPPROVE_ERROR')
              .subscribe((message) => {
                this.toastService.show(message, {
                  classname: 'toast-danger',
                });
              });
            this.isDisApprovedLoading = false;
          },
        });
    } else {
      this.translate
        .get('TOAST.NO_TIMESHEETS_SELECTED')
        .subscribe((message) => {
          this.toastService.show(message, {
            classname: 'toast-warning',
          });
        });
    }
  }

  updateSelectedGroups(selectedGroups: Set<number>): void {
    this.selectedGroups = selectedGroups;
  }

  fillSelectedProjects(): void {}

  extractPDF(): void {}
}
