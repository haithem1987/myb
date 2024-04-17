import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { IRepository } from '../repositories/repository.interface';
import { HttpClient } from '@angular/common/http';
import { typeConfig } from '../graphql/type-config';
export interface IIdentity {
  id: number;
}

export class RepositoryService<T extends IIdentity> implements IRepository<T> {
  private typeOperations: ;

  constructor(private http: HttpClient, typeKey: string) {
    if (!typeConfig[typeKey]) {
      throw new Error(
        `GraphQL operations for type ${typeKey} are not defined.`
      );
    }
    this.typeOperations = typeConfig[typeKey];
  }

  getAll(): Observable<T[]> {
    return this.http.post<T[]>('/graphql', {
      query: this.typeOperations.getAll,
    });
  }

  get(id: number): Observable<T> {
    return this.http.post<T>('/graphql', {
      query: this.typeOperations.getById,
      variables: { id },
    });
  }

  create(item: T): Observable<T> {
    return this.http.post<T>('/graphql', {
      query: this.typeOperations.create,
      variables: { item },
    });
  }

  update(id: number, item: T): Observable<T> {
    return this.http.post<T>('/graphql', {
      query: this.typeOperations.update,
      variables: { id, item },
    });
  }

  delete(id: number): Observable<any> {
    return this.http.post<any>('/graphql', {
      query: this.typeOperations.delete,
      variables: { id },
    });
  }
}
