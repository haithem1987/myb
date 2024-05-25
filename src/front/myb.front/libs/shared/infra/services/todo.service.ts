// src/app/services/todo.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Todo } from '../models/todo.model';

@Injectable({
  providedIn: 'root',
})
export class TodoService {
  private static nextId = 1;

  private todosSubject = new BehaviorSubject<Todo[]>([]);
  public todos$: Observable<Todo[]> = this.todosSubject.asObservable();

  constructor() {}

  private getTodos(): Todo[] {
    return this.todosSubject.value;
  }

  addTodo(title: string): void {
    const todos = this.getTodos();
    const todo = new Todo(TodoService.nextId++, title, false);
    this.todosSubject.next([...todos, todo]);
  }

  toggleTodoComplete(todoId: number): void {
    const todos = this.getTodos();
    const updatedTodos = todos.map((todo) => {
      if (todo.id === todoId) {
        return new Todo(todo.id, todo.title, !todo.completed);
      }
      return todo;
    });
    this.todosSubject.next(updatedTodos);
  }

  removeTodo(todoId: number): void {
    const todos = this.getTodos();
    const filteredTodos = todos.filter((todo) => todo.id !== todoId);
    this.todosSubject.next(filteredTodos);
  }

  clearCompleted(): void {
    const todos = this.getTodos().filter((todo) => !todo.completed);
    this.todosSubject.next(todos);
  }
}
