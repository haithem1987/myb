import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Timesheet } from '../../../models/timesheet.model';
import { FormsModule } from '@angular/forms';
import { TimesheetCreateComponent } from '../create/timesheet-create.component';
import { TimesheetService } from '../../../services/timesheet.service';
import { Observable, tap } from 'rxjs';
import {
  AvatarComponent,
  ProgressBarComponent,
} from 'libs/shared/shared-ui/src';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { ToastService } from 'libs/shared/infra/services/toast.service';
import {
  NgbDropdownConfig,
  NgbDropdownModule,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { TimesheetEditComponent } from '../edit/timesheet-edit.component';

@Component({
  selector: 'myb-timesheet-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TimesheetCreateComponent,
    ProgressBarComponent,
    AvatarComponent,
    NgbDropdownModule,
  ],
  providers: [NgbDropdownConfig],
  templateUrl: './timesheet-list.component.html',
  styleUrls: ['./timesheet-list.component.css'],
})
export class TimesheetListComponent implements OnInit {
  timesheets$: Observable<Timesheet[]> = this.timesheetService.timesheets$;
  userId$: Observable<string | null> = this.keycloakService.userId$;
  updatedTimesheets: Timesheet[] = [];
  searchTerm: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' | '' = '';
  workingHoursPerDay: number = 8;
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
  }

  ngOnInit(): void {
    this.timesheets$.subscribe((timesheets) => {
      this.updatedTimesheets = timesheets;
    });
    this.userId$.subscribe((userId) => {
      if (!userId) return;
      this.timesheetService
        .getTimesheetsByUserId(userId)
        .pipe(tap((timesheets) => (this.updatedTimesheets = timesheets)))
        .subscribe();
    });
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
        this.toastService.show('timesheet deleted succesfuly', {
          classname: 'toast-success',
        });
        // this.updatedTimesheets = this.updatedTimesheets.filter(
        //   (t) => t.id !== id
        // );
      });
    }
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

  private sortTimesheets(): void {
    console.log('this.updatedTimesheets', this.updatedTimesheets);
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
  }

  getApprovalStatus(timesheet: Timesheet): {
    text: string;
    badgeClass: string;
  } {
    if (timesheet.isApproved) {
      return { text: 'Approuvé', badgeClass: 'bg-success' };
    } else {
      return { text: 'En attente', badgeClass: 'bg-warning' };
    }
  }

  getWorkedHours(workedHours: number): number {
    return Number(workedHours.toFixed(1));
  }
}
