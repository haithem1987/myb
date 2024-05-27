import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Timesheet } from '../../../models/timesheet.model';
import { FormsModule } from '@angular/forms';
import { TimesheetCreateComponent } from '../create/timesheet-create.component';
import { TimesheetService } from '../../../services/timesheet.service';
import { Observable } from 'rxjs';
import { ProgressBarComponent } from 'libs/shared/shared-ui/src';

@Component({
  selector: 'myb-timesheet-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TimesheetCreateComponent,
    ProgressBarComponent,
  ],
  templateUrl: './timesheet-list.component.html',
  styleUrls: ['./timesheet-list.component.css'],
})
export class TimesheetListComponent implements OnInit {
  timesheets$: Observable<Timesheet[]> = this.timesheetService.timesheets$;
  searchTerm: string = '';
  sortColumn: string = '';
  sortDirection: string = '';

  constructor(
    private router: Router,
    private timesheetService: TimesheetService
  ) {}

  ngOnInit(): void {
    this.timesheetService.getTimesheetsByUserId('1').subscribe();
  }

  addTimesheet(): void {
    this.router.navigate(['/timesheet/add']);
  }

  editTimeSheet(id: number): void {
    this.router.navigate(['/timesheet/edit', id]);
  }

  deleteTimeSheet(id: number): void {
    if (confirm('Are you sure you want to delete this timesheet?')) {
      // Assuming a deleteTimesheet method is passed or implemented
      this.deleteTimesheet(id);
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
    // Implement sorting logic
  }

  deleteTimesheet(id: number): void {
    // Placeholder method for deletion logic
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
