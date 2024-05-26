import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbDateStruct, NgbInputDatepicker } from '@ng-bootstrap/ng-bootstrap';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  NgbDatepickerModule,
  NgbPopoverModule,
} from '@ng-bootstrap/ng-bootstrap';
import { TimesheetService } from '../../../services/timesheet.service';
import { Timesheet } from '../../../models/timesheet.model';
import { ProjectService } from '../../../services/project.service';
import { Project } from '../../../models/project.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'myb-front-timesheet-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    NgbPopoverModule,
  ],
  templateUrl: './timesheet-create.component.html',
  styleUrls: ['./timesheet-create.component.css'],
})
export class TimesheetCreateComponent implements OnInit {
  projects$: Observable<Project[]> = this.projectService.projects$;
  timesheetForm!: FormGroup;
  isTimerRunning = false;
  timer: any;
  projects = [
    { id: 1, name: 'Project 1' },
    { id: 2, name: 'Project 2' },
  ];
  employees = [
    { id: 1, name: 'Employee 1' },
    { id: 2, name: 'Employee 2' },
  ];

  @ViewChild('datePicker', { static: false }) datePicker!: NgbInputDatepicker;

  constructor(
    private fb: FormBuilder,
    private timesheetService: TimesheetService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.timesheetForm = this.fb.group({
      description: [''],
      date: [''],
      workedHours: ['00:00:00'],
      isApproved: [false],
      employeeId: [null],
      projectId: [null],
      userId: ['1'],
    });
    console.log('$projects | async', this.projects$);
  }

  onDateSelect(date: NgbDateStruct, datePicker: NgbInputDatepicker): void {
    const formattedDate = `${date.year}-${this.pad(date.month)}-${this.pad(
      date.day
    )}`;
    this.timesheetForm.get('date')?.setValue(formattedDate);
    datePicker.close();
  }

  pad(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }

  toggleTimer(): void {
    if (this.isTimerRunning) {
      clearInterval(this.timer);
      this.isTimerRunning = false;
    } else {
      this.startTimer();
      this.isTimerRunning = true;
    }
  }

  startTimer(): void {
    this.timer = setInterval(() => {
      const currentValue = this.timesheetForm.get('workedHours')?.value;
      const timeParts = currentValue.split(':');
      let hours = parseInt(timeParts[0], 10);
      let minutes = parseInt(timeParts[1], 10);
      let seconds = parseInt(timeParts[2], 10);

      seconds += 1;
      if (seconds === 60) {
        seconds = 0;
        minutes += 1;
      }
      if (minutes === 60) {
        minutes = 0;
        hours += 1;
      }

      this.timesheetForm
        .get('workedHours')
        ?.setValue(
          `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`
        );
    }, 1000);
  }

  onProjectSelect(project: any): void {
    this.timesheetForm.get('projectId')?.setValue(project.id);
  }

  onEmployeeSelect(employee: any): void {
    this.timesheetForm.get('employeeId')?.setValue(employee.id);
  }

  addEntry(): void {
    const timesheet: Timesheet = this.timesheetForm.value;
    this.timesheetService.create(timesheet).subscribe(
      (response) => {
        console.log('Timesheet entry added successfully', response);
        this.timesheetForm.reset();
      },
      (error) => {
        console.error('Error adding timesheet entry', error);
      }
    );
  }
}
