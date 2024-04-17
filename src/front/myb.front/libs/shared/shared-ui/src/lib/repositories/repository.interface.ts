// src/app/repositories/repository.interface.ts

import { Observable } from 'rxjs';

export interface IRepository<T> {
  getAll(): Observable<T[]>;
  get(id: number): Observable<T>;
  create(item: T): Observable<T>;
  update(id: number, item: T): Observable<T>;
  delete(id: number): Observable<any>;
}
