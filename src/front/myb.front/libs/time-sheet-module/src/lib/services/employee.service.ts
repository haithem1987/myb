import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';

import { Observable, map } from 'rxjs';
import { RepositoryService } from 'libs/shared/infra/services/repository.service';
import { Employee } from '../models/employee';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService extends RepositoryService<Employee> {
  constructor(apollo: Apollo) {
    super(apollo, 'Employee');
  }
  override getAll(): Observable<Employee[]> {
    return this.apollo
      .watchQuery<{ allEmployees: Employee[] }>({
        query: gql`
          ${this.typeOperations.getAll}
        `,
      })
      .valueChanges.pipe(
        map((result: any) => result.data.allEmployees) // Map to the allTasks property
      );
  }
}
