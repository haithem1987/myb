import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Employee } from '../../models/employee';
import { Project } from '../../models/project.model';
import { Task } from '../../models/task.model';
import { EmployeeService } from '../../services/employee.service';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { TaskListComponent } from './list/task-list.component';
import { ToastService } from 'libs/shared/infra/services/toast.service';
import { Observable, defaultIfEmpty } from 'rxjs';

@Component({
  selector: 'myb-front-task-screen',
  standalone: true,
  imports: [CommonModule, TaskListComponent],
  templateUrl: './task-screen.component.html',
  styleUrls: ['./task-screen.component.css'],
})
export class TaskScreenComponent implements OnInit {
  isCreatingTask: boolean = false;
  editingTask: Task | null = null;
  projectId?: number;
  projectName?: string;

  constructor(
    private taskService: TaskService,
    private projectService: ProjectService,
    private employeeService: EmployeeService,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const projectIdWithName = params.get('projectId') ?? '';
      const [projectId, projectName] = projectIdWithName.split('-');
      this.projectId = +projectId;
      this.projectName = projectName;
      this.loadTasks();
    });
    this.loadEmployees();
  }

  loadTasks() {
    if (this.projectId) {
      this.taskService.getTasksByProjectId(this.projectId).subscribe();
    } else {
      this.taskService.getAll().subscribe();
    }
  }

  loadEmployees() {
    this.employeeService.getAll().subscribe((response) => {});
  }

  onCreateTask(task: Task) {
    console.log('onEditTask', task);
    this.taskService.create(task).subscribe(
      (response: any) => {
        this.toastService.show('Task inserted successfully!', {
          classname: 'bg-success text-light',
        });
        console.log('success create', response);
      },
      (error) => {
        console.log('error', error);
        // Ideally, add error handling logic here
      }
    );
  }

  onEditTask(task: Task) {
    console.log('onEditTask', task);
    this.taskService.update(task.id, task).subscribe(
      (response: any) => {
        this.toastService.show('Task updated successfully!', {
          classname: 'bg-success text-light',
        });
        console.log('success update', response);
      },
      (error) => {
        console.log('error', error);
        // Add error handling here, possibly showing an error message to the user
      }
    );
  }

  onSaveTask(task: Task) {
    // Logic to save the new or updated task
  }

  onDeleteTask(taskId: number) {
    console.log('Deleting task with ID:', taskId);
    this.taskService.delete(taskId).subscribe(
      (response: any) => {
        this.toastService.show('Task deleted successfully!', {
          classname: 'bg-success text-light',
        });
        console.log('Deleted successfully', response);
      },
      (error) => {
        console.log('Error deleting task', error);
        // Add error handling here, possibly showing an error message to the user
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
