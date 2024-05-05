import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TaskEditComponent } from '../task-edit/task-edit.component';
import { FormsModule } from '@angular/forms';
import { Project } from '../../models/project.model';
import { Employee } from '../../models/employee';

@Component({
  selector: 'myb-front-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css',
})
export class TaskListComponent {
  @Input() tasks: Task[] = [];
  @Input() projects: Project[] = [];
  @Input() employees: Employee[] = [];
  @Output() taskUpdated = new EventEmitter<Task>();
  @Output() taskCreated = new EventEmitter<Task>();
  @Output() taskDeleted = new EventEmitter<number>();
  constructor(private modalService: NgbModal) {}

  openModal(task?: Task) {
    const modalRef = this.modalService.open(TaskEditComponent);
    modalRef.componentInstance.task = task || new Task();
    modalRef.componentInstance.projects = this.projects || [];
    modalRef.componentInstance.employees = this.employees || [];
    modalRef.componentInstance.saveEvent.subscribe((updatedTask: Task) => {
      task
        ? this.taskUpdated.emit(updatedTask)
        : this.taskCreated.emit(updatedTask);
      modalRef.close();
    });
  }

  onDelete(taskId: number) {
    this.taskDeleted.emit(taskId);
  }
}
