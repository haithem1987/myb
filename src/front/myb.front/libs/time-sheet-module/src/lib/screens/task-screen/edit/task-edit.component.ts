import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Observable, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { Task } from '../../../models/task.model';
import { Project } from '../../../models/project.model';
import { Employee } from '../../../models/employee';

@Component({
  selector: 'myb-front-task-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbTypeaheadModule],
  templateUrl: './task-edit.component.html',
  styleUrls: ['./task-edit.component.css'], // Note: it should be `styleUrls` not `styleUrl`
})
export class TaskEditComponent implements OnInit {
  taskForm: FormGroup;
  isNewTask: boolean = true;
  @Input() set task(value: Task) {
    if (value) {
      this.isNewTask = !value.id;
      this.taskForm.patchValue({
        ...value,
        startTime: value.startTime
          ? new Date(value.startTime).toISOString().slice(0, 16)
          : '',
        endTime: value.endTime
          ? new Date(value.endTime).toISOString().slice(0, 16)
          : '',
      });
    } else {
      this.isNewTask = true;
    }
  }
  @Input() projects: Project[] = [];
  @Input() employees: Employee[] = [];
  @Output() saveEvent = new EventEmitter<Task>();

  searchEmployees = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map((term) =>
        term.length < 2
          ? []
          : this.employees
              .filter(
                (v) => v.name.toLowerCase().indexOf(term.toLowerCase()) > -1
              )
              .slice(0, 10)
      )
    );

  searchProjects = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map((term) =>
        term.length < 2
          ? []
          : this.projects
              .filter(
                (v) =>
                  v.projectName.toLowerCase().indexOf(term.toLowerCase()) > -1
              )
              .slice(0, 10)
      )
    );

  formatEmployeeResult = (result: any) => result.name;
  formatProjectResult = (result: any) => result.projectName;

  constructor(public activeModal: NgbActiveModal, private fb: FormBuilder) {
    this.taskForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      description: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      isCompleted: [false],
      employeeId: [null, Validators.required],
      projectId: [null, Validators.required],
      userId: ['1', Validators.required],
      createdAt: [null],
      updatedAt: [null],
    });
  }

  ngOnInit(): void {
    if (this.isNewTask) {
      this.taskForm.reset(new Task());
    }
  }

  save() {
    if (this.taskForm.valid) {
      const task = this.taskForm.value as Task;
      this.saveEvent.emit(task);
      this.activeModal.close('Save');
    }
  }
}
