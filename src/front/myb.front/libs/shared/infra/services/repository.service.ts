import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { typeConfig } from '../graphql/type-config';
import { IRepository } from '../repositories/repository.interface';
import { IIdentity } from '../models/user.model';
import { Inject, Injectable } from '@angular/core';
import { TYPE_KEY_TOKEN } from '../tokens/apolloToken';

export class RepositoryService<T extends IIdentity> implements IRepository<T> {
  protected typeOperations: any;

  constructor(
    protected apollo: Apollo,
    @Inject(TYPE_KEY_TOKEN) typeKey: string,
    private serviceName: string = 'timesheetService'
  ) {
    if (!typeConfig[typeKey]) {
      throw new Error(
        `GraphQL operations for type ${typeKey} are not defined.`
      );
    }
    this.typeOperations = typeConfig[typeKey];
  }

  private getServiceContext() {
    return {
      context: {
        service: this.serviceName,
      },
    };
  }

  protected mapAllItems(result: any): T[] {
    return result.data?.allItems || [];
  }

  protected mapSingleItem(result: any): T {
    return result.data?.item as T;
  }

  protected mapCreateItem(result: any): T {
    return result.data?.createItem as T;
  }

  protected mapUpdateItem(result: any): T {
    return result.data?.updateItem as T;
  }

  protected mapDeleteResult(result: any): boolean {
    return result.data?.deleteItem === true;
  }

  getAll(): Observable<T[]> {
    return this.apollo
      .watchQuery<{ allItems: T[] }>({
        query: gql`
          ${this.typeOperations.getAll}
        `,
        ...this.getServiceContext(),
      })
      .valueChanges.pipe(map((result) => this.mapAllItems(result)));
  }

  get(id: number | string): Observable<T> {
    return this.apollo
      .query<{ item: T }>({
        query: gql`
          ${this.typeOperations.getById}
        `,
        variables: { id },
        ...this.getServiceContext(),
      })
      .pipe(map((result) => this.mapSingleItem(result)));
  }

  create(item: T): Observable<T> {
    return this.apollo
      .mutate<{ createItem: T }>({
        mutation: gql`
          ${this.typeOperations.create}
        `,
        variables: { item },
        ...this.getServiceContext(),
      })
      .pipe(map((result) => this.mapCreateItem(result)));
  }

  update(id: number | string, item: T): Observable<T> {
    const { __typename, ...itemInputWithoutTypename } = item;
    return this.apollo
      .mutate<{ updateItem: T }>({
        mutation: gql`
          ${this.typeOperations.update}
        `,
        variables: { id, item: itemInputWithoutTypename },
        ...this.getServiceContext(),
      })
      .pipe(map((result) => this.mapUpdateItem(result)));
  }

  delete(id: number | string): Observable<any> {
    return this.apollo
      .mutate<{ deleteItem: { success: boolean } }>({
        mutation: gql`
          ${this.typeOperations.delete}
        `,
        variables: { id },
        ...this.getServiceContext(),
      })
      .pipe(map((result) => this.mapDeleteResult(result)));
  }
}
