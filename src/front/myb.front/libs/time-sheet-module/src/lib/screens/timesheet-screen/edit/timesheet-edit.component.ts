import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Timesheet } from '../../../models/timesheet.model';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  NgbActiveModal,
  NgbDatepickerModule,
} from '@ng-bootstrap/ng-bootstrap';
import { TimesheetService } from '../../../services/timesheet.service';
import { ToastService } from 'libs/shared/infra/services/toast.service';
import { ProjectService } from '../../../services/project.service';
import { EmployeeService } from '../../../services/employee.service';
import { Observable } from 'rxjs';
import { Project } from '../../../models/project.model';
import { Employee } from '../../../models/employee';
import { DateUtilsService } from 'libs/shared/shared-ui/src';

@Component({
  selector: 'myb-front-timesheet-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
  ],
  templateUrl: './timesheet-edit.component.html',
  styleUrls: ['./timesheet-edit.component.css'],
})
export class TimesheetEditComponent implements OnInit {
  @Input() timesheet!: Timesheet;
  editForm!: FormGroup;
  activeProjects$: Observable<Project[]> = this.projectService.activeProjects$;
  employees$: Observable<Employee[]> = this.employeeService.employees$;
  selectedProject: Project | null = null;
  selectedEmployee: Employee | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private timesheetService: TimesheetService,
    private toastService: ToastService,
    private projectService: ProjectService,
    private employeeService: EmployeeService,
    private dateUtils: DateUtilsService
  ) {
    this.editForm = this.fb.group({
      description: ['', Validators.required],
      date: [null, Validators.required],
      workedHours: ['', Validators.required],
      projectId: [null, Validators.required],
      employeeId: [null, Validators.required],
      projectName: ['', Validators.required],
      employeeName: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.editForm.patchValue(this.convertTimesheetToFormValues(this.timesheet));
    this.projectService.getAll().subscribe();
    this.employeeService.getAll().subscribe();
  }

  onProjectSelect(event: any): void {
    const selectedProject = this.findProjectById(parseInt(event.target.value));
    if (selectedProject) {
      this.editForm.patchValue({
        projectName: selectedProject.projectName,
      });
    }
  }

  async onEmployeeSelect(event: any): Promise<void> {
    const selectedEmployee = this.findEmployeeById(
      parseInt(event.target.value)
    );
    console.log('selectedEmployee', selectedEmployee);
    if (selectedEmployee) {
      this.editForm.patchValue({
        employeeName: selectedEmployee.name,
      });
    }
  }

  save(): void {
    if (this.editForm.valid) {
      const updatedTimesheet = this.convertFormValuesToTimesheet();
      console.log('updatedTimesheet', updatedTimesheet);
      this.timesheetService
        .update(updatedTimesheet.id, updatedTimesheet)
        .subscribe({
          next: () => {
            this.toastService.show('Timesheet updated successfully', {
              classname: 'bg-success text-light',
            });
            this.activeModal.close('saved');
          },
          error: (err) => {
            this.toastService.show('Error updating timesheet', {
              classname: 'bg-danger text-light',
            });
          },
        });
    }
  }

  cancel(): void {
    this.activeModal.dismiss('cancel');
  }

  private convertTimesheetToFormValues(timesheet: Timesheet): any {
    return {
      ...timesheet,
      date: timesheet.date
        ? this.dateUtils.toDateStruct(new Date(timesheet.date))
        : null,
    };
  }

  private convertFormValuesToTimesheet(): Timesheet {
    const formValues = this.editForm.value;
    console.log('formValues', formValues);
    return {
      ...this.timesheet,
      ...formValues,
      date: formValues.date
        ? this.dateUtils.fromDateStruct(formValues.date)
        : null,
      workedHours: parseFloat(formValues.workedHours),
      projectId: +formValues.projectId,
      employeeId: +formValues.employeeId,
    };
  }

  private findProjectById(id: number): Project | null {
    let foundProject: Project | null = null;
    this.activeProjects$.subscribe((projects) => {
      foundProject = projects.find((project) => project.id === id) || null;
    });
    return foundProject;
  }

  private findEmployeeById(id: number): Employee | null {
    let foundEmployee: Employee | null = null;
    this.employees$.subscribe((employees) => {
      foundEmployee = employees.find((employee) => employee.id === id) || null;
    });
    return foundEmployee;
  }
}
