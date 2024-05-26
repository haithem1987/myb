import { Injectable } from '@angular/core';
import { RepositoryService } from 'libs/shared/shared-ui/src/lib/services/repository.service';
import { Task } from '../models/task.model';
import { Apollo, gql } from 'apollo-angular';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TaskService extends RepositoryService<Task> {
  constructor(apollo: Apollo) {
    super(apollo, 'Task');
  }
  override getAll(): Observable<Task[]> {
    return this.apollo
      .watchQuery<{ allTasks: Task[] }>({
        query: gql`
          ${this.typeOperations.getAll}
        `,
      })
      .valueChanges.pipe(
        map((result: any) => result.data.allTasks) // Map to the allTasks property
      );
  }
  getTasksByProjectId(id: number): Observable<Task[]> {
    return this.apollo
      .watchQuery<{ tasksByProjectId: Task[] }>({
        query: gql`
          ${this.typeOperations.getTasksByProjectId}
        `,
        variables: { id },
      })
      .valueChanges.pipe(
        map((result: any) => result.data.tasksByProjectId) // Map to the allTasks property
      );
  }

  // Task-specific methods
  // startTask(taskId: number): Observable<Task> {
  //   // Implementation to start a task
  //   return  ""
  // }
  // pauseTask(taskId: number): Observable<Task> {
  //   // Implementation to pause a task
  // }

  // completeTask(taskId: number): Observable<Task> {
  //   // Implementation to complete a task
  // }

  // ... other task-specific methods
}
