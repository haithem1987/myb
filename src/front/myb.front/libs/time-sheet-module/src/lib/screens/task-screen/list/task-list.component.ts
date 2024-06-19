import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
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
import { Observable, defaultIfEmpty } from 'rxjs';
import { TaskService } from '../../../services/task.service';
import { ProjectService } from '../../../services/project.service';
import { EmployeeService } from '../../../services/employee.service';

@Component({
  selector: 'myb-front-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss'],
})
export class TaskListComponent implements OnInit {
  updatedTasks: Task[] = [];
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' | '' = '';
  searchTerm: string = '';
  tasks$: Observable<Task[]> = this.taskService.tasks$.pipe(defaultIfEmpty([]));
  activeProjects$: Observable<Project[]> =
    this.projectService.activeProjects$.pipe(defaultIfEmpty([]));
  employees$: Observable<Employee[]> = this.employeeService.employees$.pipe(
    defaultIfEmpty([])
  );
  @Output() taskUpdated = new EventEmitter<Task>();
  @Output() taskCreated = new EventEmitter<Task>();
  @Output() taskDeleted = new EventEmitter<number>();

  constructor(
    private modalService: NgbModal,
    private dateUtils: DateUtilsService,
    private taskService: TaskService,
    private projectService: ProjectService,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    this.tasks$.subscribe((tasks) => {
      this.updatedTasks = [...tasks];
      this.sortTasks();
    });
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
      this.tasks$.subscribe((tasks) => {
        this.updatedTasks = [...tasks];
      });
    } else {
      this.tasks$.subscribe((tasks) => {
        this.updatedTasks = [...tasks].sort((a: any, b: any) => {
          const valueA = a[this.sortColumn] as string; // Assuming all sortable fields are strings
          const valueB = b[this.sortColumn] as string;
          return this.sortDirection === 'asc'
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        });
      });
    }
  }

  filterTasks(): void {
    if (!this.searchTerm) {
      this.tasks$.subscribe((tasks) => {
        this.updatedTasks = [...tasks];
      });
    } else {
      this.tasks$.subscribe((tasks) => {
        this.updatedTasks = tasks.filter((task) =>
          task.description.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      });
    }
  }

  onDelete(taskId: number) {
    this.taskDeleted.emit(taskId);
  }

  openModal(task?: Task) {
    const modalRef = this.modalService.open(TaskEditComponent);
    modalRef.componentInstance.task = task || new Task();
    this.activeProjects$.subscribe((projects) => {
      modalRef.componentInstance.projects = projects;
    });
    this.employees$.subscribe((employees) => {
      modalRef.componentInstance.employees = employees;
    });
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
