import { Injectable } from '@angular/core';
import { RepositoryService } from '../../../../shared/infra/services/repository.service';
import { Task } from '../models/task.model';
import { Apollo, gql } from 'apollo-angular';
import { BehaviorSubject, Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TaskService extends RepositoryService<Task> {
  private taskSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.taskSubject.asObservable();
  constructor(apollo: Apollo) {
    super(apollo, 'Task', 'timesheetService');
    // this.loadInitialTasks();
  }

  private loadInitialTasks(): void {
    this.getAll().subscribe((tasks) => this.taskSubject.next(tasks));
  }

  protected override mapAllItems(result: any): Task[] {
    return result.data?.allTasks || [];
  }

  protected override mapSingleItem(result: any): Task {
    return result.data?.TaskById as Task;
  }

  protected override mapCreateItem(result: any): Task {
    return result.data?.addTask as Task;
  }

  protected override mapUpdateItem(result: any): Task {
    return result.data?.updateTask as Task;
  }

  protected override mapDeleteResult(result: any): boolean {
    return result.data?.deleteTask === true;
  }

  override getAll(): Observable<Task[]> {
    return super.getAll().pipe(
      map((tasks) => {
        console.log('tasks', tasks);
        this.taskSubject.next(tasks);
        return tasks;
      })
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
        map((result: any) => {
          const tasks = result.data.tasksByProjectId;
          this.taskSubject.next(tasks);
          return tasks;
        }) // Map to the allTasks property
      );
  }
  override get(id: number): Observable<Task> {
    return super.get(id).pipe(
      map((project) => {
        const tasks = this.taskSubject.value.map((p) =>
          p.id === id ? project : p
        );
        this.taskSubject.next(tasks);
        return project;
      })
    );
  }

  override create(item: Task): Observable<Task> {
    return super.create(item).pipe(
      map((newTask) => {
        const tasks = [...this.taskSubject.value, newTask];
        this.taskSubject.next(tasks);
        return newTask;
      })
    );
  }

  override update(id: number, item: Task): Observable<Task> {
    return super.update(id, item).pipe(
      map((updatedTask) => {
        const tasks = this.taskSubject.value.map((t) =>
          t.id === id ? updatedTask : t
        );
        this.taskSubject.next(tasks);
        return updatedTask;
      })
    );
  }

  override delete(id: number): Observable<boolean> {
    return super.delete(id).pipe(
      map((success) => {
        if (success) {
          const tasks = this.taskSubject.value.filter((t) => t.id !== id);
          this.taskSubject.next(tasks);
        }
        return success;
      })
    );
  }
}
