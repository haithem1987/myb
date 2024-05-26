import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { Task } from '../../../models/task.model';
import { Project } from '../../../models/project.model';
import { Employee } from '../../../models/employee';
import { TaskEditComponent } from '../edit/task-edit.component';
import { DateUtilsService } from 'libs/shared/shared-ui/src';

@Component({
  selector: 'myb-front-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss'],
})
export class TaskListComponent implements OnChanges {
  updatedTasks: Task[] = [];
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' | '' = '';
  searchTerm: string = '';
  @Input() tasks: Task[] = [];
  @Input() projects: Project[] = [];
  @Input() employees: Employee[] = [];
  @Output() taskUpdated = new EventEmitter<Task>();
  @Output() taskCreated = new EventEmitter<Task>();
  @Output() taskDeleted = new EventEmitter<number>();

  constructor(
    private modalService: NgbModal,
    private dateUtils: DateUtilsService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks']) {
      this.updatedTasks = [...this.tasks]; // Copy the input to the display array
      this.sortTasks();
    }
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      // Toggle sort direction
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortTasks();
  }

  private sortTasks(): void {
    if (!this.sortColumn || this.sortDirection === '') {
      this.updatedTasks = [...this.tasks];
    } else {
      this.updatedTasks = [...this.tasks].sort((a: any, b: any) => {
        const valueA = a[this.sortColumn] as string; // Assuming all sortable fields are strings
        const valueB = b[this.sortColumn] as string;
        return this.sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      });
    }
  }

  filterTasks(): void {
    if (!this.searchTerm) {
      this.updatedTasks = [...this.tasks];
    } else {
      this.updatedTasks = this.tasks.filter((task) =>
        task.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  onDelete(taskId: number) {
    this.taskDeleted.emit(taskId);
  }

  openModal(task?: Task) {
    const modalRef = this.modalService.open(TaskEditComponent);
    modalRef.componentInstance.task = task || new Task();
    modalRef.componentInstance.projects = this.projects;
    modalRef.componentInstance.employees = this.employees;
    modalRef.componentInstance.saveEvent.subscribe((updatedTask: Task) => {
      if (task) {
        this.taskUpdated.emit(updatedTask);
      } else {
        this.taskCreated.emit(updatedTask);
      }
      modalRef.close();
    });
  }
  isCompletedLabel(task: Task): string {
    return task.isCompleted ? 'Terminé' : 'En cours';
  }

  getCompletionBadgeClass(task: Task): string {
    return task.isCompleted ? 'bg-success' : 'bg-warning';
  }
  getTimeRemaining(dueDate: string | undefined): string {
    if (!dueDate || dueDate == undefined) return '--';
    return this.dateUtils.calculateTimeRemaining(dueDate);
  }
}
