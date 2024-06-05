import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbDateStruct, NgbInputDatepicker } from '@ng-bootstrap/ng-bootstrap';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  NgbDatepickerModule,
  NgbPopoverModule,
} from '@ng-bootstrap/ng-bootstrap';
import { TimesheetService } from '../../../services/timesheet.service';
import { Timesheet } from '../../../models/timesheet.model';
import { ProjectService } from '../../../services/project.service';
import { Project } from '../../../models/project.model';
import { Observable, tap } from 'rxjs';
import { ToastService } from 'libs/shared/infra/services/toast.service';
import { Employee } from '../../../models/employee';
import { EmployeeService } from '../../../services/employee.service';
import { DateUtilsService } from 'libs/shared/shared-ui/src';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';

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
  employees$: Observable<Employee[]> = this.employeeService.employees$;
  timesheetForm!: FormGroup;
  isTimerRunning = false;
  timer: any;

  @ViewChild('datePicker', { static: false }) datePicker!: NgbInputDatepicker;

  constructor(
    private fb: FormBuilder,
    private timesheetService: TimesheetService,
    private projectService: ProjectService,
    private employeeService: EmployeeService,
    private toastService: ToastService,
    private dateUtils: DateUtilsService,
    private keycloakService: KeycloakService
  ) {
    this.projectService.getAll().subscribe();
    this.employeeService.getAll().subscribe();
  }

  ngOnInit(): void {
    const currentDate = this.getCurrentDate();

    this.timesheetForm = this.fb.group({
      description: ['', Validators.required],
      date: [currentDate, Validators.required], // Set current date as default
      workedHours: ['00:00:00', Validators.required], // Use string for display
      isApproved: [false, Validators.required],
      employeeId: [null, Validators.required],
      employeeName: [''],
      projectId: [null, Validators.required],
      projectName: [''],
      userId: ['', Validators.required],
    });
    this.keycloakService.userId$.subscribe((userId) => {
      if (userId) {
        this.timesheetForm.get('userId')?.setValue(userId);
      }
    });
    console.log('$projects | async', this.projects$);
  }

  getCurrentDate(): NgbDateStruct {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    };
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
    this.timesheetForm.get('projectName')?.setValue(project.projectName);
  }

  onEmployeeSelect(employee: any): void {
    this.timesheetForm.get('employeeId')?.setValue(employee.id);
    this.timesheetForm.get('employeeName')?.setValue(employee.name);
  }

  addEntry(): void {
    if (this.timesheetForm.valid) {
      const formValue = this.timesheetForm.value;
      const [hours, minutes, seconds] = formValue.workedHours
        .split(':')
        .map((part: string) => parseInt(part, 10));
      const workedHours = hours + minutes / 60 + seconds / 3600;

      const timesheet: Timesheet = {
        ...formValue,
        workedHours,
        employeeId: Number(formValue.employeeId),
        projectId: Number(formValue.projectId),
        date: this.dateUtils.fromDateStruct(formValue.date),
      };
      console.log('timesheet', timesheet);
      this.timesheetService
        .create(timesheet)
        .pipe(
          tap({
            next: (response) => {
              console.log('Timesheet entry added successfully', response);
              this.timesheetForm.reset();
              this.toastService.show('Timesheet entry added successfully', {
                classname: 'bg-success text-light',
              });
            },
            error: (error) => {
              console.error('Error adding timesheet entry', error);
              this.toastService.show('Error adding timesheet entry', {
                classname: 'bg-danger text-light',
              });
            },
          })
        )
        .subscribe();
    } else {
      console.log('Form is invalid');
      this.toastService.show('Erreur, Vérifier les champs obligatoires', {
        classname: 'border border-success bg-success text-light',
      });
    }
  }
}
