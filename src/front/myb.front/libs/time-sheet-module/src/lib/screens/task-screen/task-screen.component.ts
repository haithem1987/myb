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

@Component({
  selector: 'myb-front-task-screen',
  standalone: true,
  imports: [CommonModule, TaskListComponent],
  templateUrl: './task-screen.component.html',
  styleUrls: ['./task-screen.component.css'],
})
export class TaskScreenComponent implements OnInit {
  tasks: Task[] = [];
  projects: Project[] = [];
  employees: Employee[] = [];
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
    this.loadProjects();
    this.loadEmployees();
  }

  loadTasks() {
    if (this.projectId) {
      this.taskService
        .getTasksByProjectId(this.projectId)
        .subscribe((tasks) => {
          console.log('tasks by project', tasks);
          this.tasks = tasks;
        });
    } else {
      this.taskService.getAll().subscribe((tasks) => {
        console.log('tasks', tasks);
        this.tasks = tasks;
      });
    }
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
      (response: any) => {
        this.toastService.show('Task inserted successfully!', {
          classname: 'bg-success text-light',
        });
        console.log('success create', response);
        this.tasks = [...this.tasks, response.addTask];
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
        const index = this.tasks.findIndex(
          (t) => t.id === response.updateTask.id
        ); // Find index of the task to update
        console.log('index', index);
        if (index !== -1) {
          this.tasks = [
            ...this.tasks.slice(0, index),
            response.updateTask,
            ...this.tasks.slice(index + 1),
          ]; // Update the task in the local array
        }
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
        // Remove the task from the local array
        this.tasks = [...this.tasks.filter((task) => task.id !== taskId)];
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
