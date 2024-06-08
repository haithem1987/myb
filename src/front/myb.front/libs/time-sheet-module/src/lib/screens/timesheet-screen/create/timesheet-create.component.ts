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
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

@Component({
  selector: 'myb-front-timesheet-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    NgbPopoverModule,
    NgxMaskDirective,
  ],
  providers: [provideNgxMask()],
  templateUrl: './timesheet-create.component.html',
  styleUrls: ['./timesheet-create.component.css'],
})
export class TimesheetCreateComponent implements OnInit {
  projects$: Observable<Project[]> = this.projectService.projects$;
  employees$: Observable<Employee[]> = this.employeeService.employees$;
  timesheetForm!: FormGroup;
  isTimerRunning = false;
  timer: any;
  selectedProject: Project | null = null;
  selectedEmployee: Employee | null = null;

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
      date: [currentDate, Validators.required],
      workedHours: ['000000', [Validators.required, this.timeValidator]],
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
      const hours = parseInt(currentValue.substring(0, 2), 10);
      const minutes = parseInt(currentValue.substring(2, 4), 10);
      const seconds = parseInt(currentValue.substring(4, 6), 10);

      const newSeconds = (seconds + 1) % 60;
      const newMinutes = (minutes + Math.floor((seconds + 1) / 60)) % 60;
      const newHours =
        hours + Math.floor((minutes + Math.floor((seconds + 1) / 60)) / 60);

      this.timesheetForm
        .get('workedHours')
        ?.setValue(
          `${this.pad(newHours)}${this.pad(newMinutes)}${this.pad(newSeconds)}`
        );
    }, 1000);
  }

  onProjectSelect(selectedProject: Project): void {
    this.selectedProject = selectedProject;
    if (selectedProject) {
      this.timesheetForm.patchValue({
        projectId: selectedProject.id,
        projectName: selectedProject.projectName,
      });
    } else {
      this.timesheetForm.patchValue({
        projectId: null,
        projectName: '',
      });
    }
  }

  onEmployeeSelect(selectedEmployee: Employee): void {
    this.selectedEmployee = selectedEmployee;
    if (selectedEmployee) {
      this.timesheetForm.patchValue({
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
      });
    } else {
      this.timesheetForm.patchValue({
        employeeId: null,
        employeeName: '',
      });
    }
  }

  addEntry(): void {
    if (this.timesheetForm.valid) {
      const formValue = this.timesheetForm.value;
      const [hours, minutes, seconds] = this.addSeparators(
        formValue.workedHours
      )
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

      this.timesheetService.create(timesheet).subscribe({
        next: (response) => {
          this.selectedEmployee = null;
          this.selectedProject = null;
          this.timesheetForm.reset({
            description: '',
            date: this.getCurrentDate(),
            workedHours: '000000',
            isApproved: false,
            employeeId: null,
            employeeName: '',
            projectId: null,
            projectName: '',
            userId: this.timesheetForm.get('userId')?.value,
          });
          this.toastService.show('Timesheet entry added successfully', {
            classname: 'bg-success text-light',
          });
        },
        error: (error) => {
          this.toastService.show('Error adding timesheet entry', {
            classname: 'bg-danger text-light',
          });
        },
      });
    } else {
      this.toastService.show('Erreur, Vérifier les champs obligatoires', {
        classname: 'border border-success bg-success text-light',
      });
    }
  }

  private timeValidator(control: any): { [key: string]: boolean } | null {
    if (!control.value) {
      return { invalidTime: true };
    }
    const timeStr = control.value;
    if (timeStr.length !== 6) {
      return { invalidTime: true };
    }
    const hours = parseInt(timeStr.substring(0, 2), 10);
    const minutes = parseInt(timeStr.substring(2, 4), 10);
    const seconds = parseInt(timeStr.substring(4, 6), 10);

    if (
      isNaN(hours) ||
      isNaN(minutes) ||
      isNaN(seconds) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59 ||
      seconds < 0 ||
      seconds > 59
    ) {
      return { invalidTime: true };
    }
    return null;
  }

  private addSeparators(timeStr: string): string {
    if (timeStr.length !== 6) {
      return timeStr;
    }
    return `${timeStr.substring(0, 2)}:${timeStr.substring(
      2,
      4
    )}:${timeStr.substring(4, 6)}`;
  }
}
