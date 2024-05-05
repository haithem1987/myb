import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.model';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { Employee } from '../../models/employee';
import { Project } from '../../models/project.model';
import {
  NgbCalendar,
  NgbDatepickerModule,
  NgbDateStruct,
} from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'myb-front-task-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbDatepickerModule],
  templateUrl: './task-edit.component.html',
  styleUrls: ['./task-edit.component.css'], // Note: it should be `styleUrls` not `styleUrl`
})
export class TaskEditComponent implements OnInit {
  isNewTask: boolean = true;
  editableTask: Task = new Task();
  @Input() set task(value: Task) {
    this.editableTask = value ? { ...value } : new Task(); // Initialize with a new Task if null
    this.editableTask.startTime = new Date(value.startTime).toISOString();
    console.log('this.editableTask', this.editableTask.startTime);
    this.isNewTask = !value?.id ? true : false; // Determine if it's a new task based on the presence of an `id`
  }
  @Input() projects: Project[] = [];
  @Input() employees: Employee[] = [];

  // @Output() update = new EventEmitter<Task>();
  // @Output() create = new EventEmitter<Task>();
  @Output() saveEvent = new EventEmitter<Task>();

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    // If editableTask hasn't been initialized by the input setter, initialize it here
    // if (!this.editableTask) {
    //   this.editableTask = new Task();
    //   this.isNewTask = true;
    // }
  }

  onProjectChange(): void {
    const selectedProject = this.projects.find(
      (p) => p.id == this.editableTask.projectId
    );
    this.editableTask.project = selectedProject;
  }
  onEmployeeChange(): void {
    const selectedEmployee = this.employees.find(
      (p) => p.id == this.editableTask.employeeId
    );
    this.editableTask.employee = selectedEmployee;
  }

  save() {
    // if (this.isNewTask) {
    //   // Assuming you have a service to handle creating a task
    //   // You would call that service here, then emit the result if needed
    //   console.log('Creating a new task:', this.editableTask);
    //   // this.taskService.createTask(this.editableTask).subscribe(result => {
    //   //   this.update.emit(result);  // Optionally emit the new task
    //   // });
    // } else {
    //   console.log('Updating existing task:', this.editableTask);
    //   this.update.emit(this.editableTask); // Emit the updated task
    // }
    this.saveEvent.emit(this.editableTask);
    this.activeModal.close('Save'); // Close the modal after save
  }
}
