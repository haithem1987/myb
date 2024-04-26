import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TaskEditComponent } from '../task-edit/task-edit.component';

@Component({
  selector: 'myb-front-task-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css',
})
export class TaskListComponent {
  @Input() tasks: Task[] = [];
  @Output() edit = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<number>();

  constructor(private modalService: NgbModal) {}

  openEditModal(task: Task) {
    const modalRef = this.modalService.open(TaskEditComponent);
    console.log('task', task);
    modalRef.componentInstance.task = task;
    modalRef.result.then(
      (result) => {
        if (result === 'save') {
          this.edit.emit(task);
        }
      },
      (reason) => {
        // Handle modal dismissal
      }
    );
  }

  onDelete(taskId: number) {
    this.delete.emit(taskId);
  }
}
