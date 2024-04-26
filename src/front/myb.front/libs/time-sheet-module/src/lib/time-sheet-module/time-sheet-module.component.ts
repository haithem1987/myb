import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../services/task.service';
import { Task } from '../models/task.model';
import { TaskActionsComponent } from '../components/task-actions/task-actions.component';
import { TaskCreateComponent } from '../components/task-create/task-create.component';
import { TaskEditComponent } from '../components/task-edit/task-edit.component';
import { TaskListComponent } from '../components/task-list/task-list.component';

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
  isCreatingTask: boolean = false;
  editingTask: Task | null = null;

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.taskService.getAll().subscribe((tasks) => {
      console.log('tasks', tasks);
      this.tasks = tasks;
    });
  }

  onCreateTask() {
    this.isCreatingTask = true;
  }

  onEditTask(task: Task) {
    this.taskService.update(task.id, task).subscribe(
      (updatedTask) => {
        console.log('updatedTask', updatedTask);
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
    // Logic to delete the task
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
