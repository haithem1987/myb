import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TimesheetService } from '../../services/timesheet.service';
import { Timesheet } from '../../models/timesheet.model';
import { TimesheetListComponent } from './list/timesheet-list.component';

@Component({
  selector: 'myb-front-timesheet-screen',
  standalone: true,
  imports: [CommonModule, TimesheetListComponent],
  templateUrl: './timesheet-screen.component.html',
  styleUrls: ['./timesheet-screen.component.css'],
})
export class TimesheetScreenComponent implements OnInit {
  constructor(
    private timesheetService: TimesheetService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTimesheets();
  }

  loadTimesheets(): void {
    // this.timesheetService.getTimesheetsByUserId('1').subscribe(
    // );
  }

  editTimeSheet(id: number): void {
    this.router.navigate(['/timesheet/edit', id]);
  }

  deleteTimeSheet(id: number): void {
    if (confirm('Are you sure you want to delete this timesheet?')) {
      this.timesheetService.delete(id).subscribe(
        () => this.loadTimesheets(),
        (error) => console.error('Error deleting timesheet', error)
      );
    }
  }
}
