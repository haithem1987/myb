import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.model';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'myb-front-task-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-edit.component.html',
  styleUrl: './task-edit.component.css',
})
export class TaskEditComponent {
  description: string = '';

  @Input() set task(value: Task | undefined) {
    console.log('value', value);
    if (value) {
      this.description = value.description;
    }
  }

  constructor(public activeModal: NgbActiveModal) {}

  save() {
    // Logic to save the changes made to the task
    // This might involve calling a service method to update the task on the server
    this.activeModal.close('save');
  }
}
