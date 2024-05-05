import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../services/task.service';
import { Task } from '../models/task.model';
import { TaskActionsComponent } from '../components/task-actions/task-actions.component';
import { TaskCreateComponent } from '../components/task-create/task-create.component';
import { TaskEditComponent } from '../components/task-edit/task-edit.component';
import { TaskListComponent } from '../components/task-list/task-list.component';
import { Project } from '../models/project.model';
import { Employee } from '../models/employee';
import { ProjectService } from '../services/project.service';
import { EmployeeService } from '../services/employee.service';

@Component({
  selector: 'myb-front-time-sheet-module',
  standalone: true,
  imports: [
    CommonModule,
    TaskActionsComponent,
    TaskCreateComponent,
    TaskEditComponent,
    TaskListComponent,
  ],
  templateUrl: './time-sheet-module.component.html',
  styleUrl: './time-sheet-module.component.css',
})
export class TimeSheetModuleComponent implements OnInit {
  tasks: Task[] = [];
  projects: Project[] = [];
  employees: Employee[] = [];
  isCreatingTask: boolean = false;
  editingTask: Task | null = null;

  constructor(
    private taskService: TaskService,
    private projectService: ProjectService,
    private employeeService: EmployeeService
  ) {}

  ngOnInit() {
    this.loadTasks();
    this.loadProjects();
    this.loadEmployees();
  }

  loadTasks() {
    this.taskService.getAll().subscribe((tasks) => {
      console.log('tasks', tasks);
      this.tasks = tasks;
    });
  }
  loadProjects() {
    this.projectService.getAll().subscribe((response) => {
      this.projects = response;
    });
  }
  loadEmployees() {
    this.employeeService.getAll().subscribe((response) => {
      console.log('employees', response);
      this.employees = response;
    });
  }

  onCreateTask(task: Task) {
    console.log('onEditTask', task);
    this.taskService.create(task).subscribe(
      (updatedTask) => {
        console.log('success create', updatedTask);
        this.loadTasks();
      },
      (error) => {
        console.log('error', error);
        // Handle error
      }
    );
  }
  onEditTask(task: Task) {
    console.log('onEditTask', task);
    this.taskService.update(task.id, task).subscribe(
      (updatedTask) => {
        console.log('success update', updatedTask);
        this.loadTasks();
      },
      (error) => {
        console.log('error', error);
        // Handle error
      }
    );
  }

  onSaveTask(task: Task) {
    // Logic to save the new or updated task
  }

  onDeleteTask(taskId: number) {
    this.taskService.delete(taskId).subscribe(
      (response) => {
        console.log('deleted succesfully', response);
        this.loadTasks();
      },
      (error) => {
        console.log('error', error);
        // Handle error
      }
    );
  }

  onRefreshTasks() {
    this.loadTasks();
  }

  onCancelCreate() {
    this.isCreatingTask = false;
  }

  onCancelEdit() {
    // this.selectedTask = null;
  }
}
