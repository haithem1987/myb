import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { typeConfig } from '../graphql/type-config';

import { Inject, Injectable } from '@angular/core';
import { IIdentity } from '../models/user.model';
import { IRepository } from '../repositories/repository.interface';
import { TYPE_KEY_TOKEN} from '../tokens/apolloToken'

export class RepositoryService<T extends IIdentity> implements IRepository<T> {
  protected typeOperations: any;

  constructor(
    protected apollo: Apollo,
    @Inject(TYPE_KEY_TOKEN) typeKey: string
  ) {
    if (!typeConfig[typeKey]) {
      throw new Error(
        `GraphQL operations for type ${typeKey} are not defined.`
      );
    }
    this.typeOperations = typeConfig[typeKey];
  }

  getAll(): Observable<T[]> {
    return this.apollo
      .watchQuery<T[]>({
        query: gql`
          ${this.typeOperations.getAll}
        `,
      })
      .valueChanges.pipe(map((result) => result.data));
  }

  get(id: number): Observable<T> {
    return this.apollo
      .query<{ item: T }>({
        // Explicitly typing the expected return structure
        query: gql`
          ${this.typeOperations.getById}
        `,
        variables: { id },
      })
      .pipe(
        map((result) => result.data.item as T) // Type assertion here
      );
  }

  create(item: T): Observable<T> {
    return this.apollo
      .mutate<T>({
        mutation: gql`
          ${this.typeOperations.create}
        `,
        variables: { item },
      })
      .pipe(map((result) => result.data as T));
  }

  update(id: number, item: T): Observable<T> {
    const { __typename, ...itemInputWithoutTypename } = item;
    return this.apollo
      .mutate<T>({
        mutation: this.typeOperations.update,
        variables: { id, item: itemInputWithoutTypename },
      })
      .pipe(map((result) => result.data as T));
  }

  delete(id: number): Observable<any> {
    return this.apollo
      .mutate<any>({
        mutation: gql`
          ${this.typeOperations.delete}
        `,
        variables: { id },
      })
      .pipe(map((result) => result.data as T));
  }
}
