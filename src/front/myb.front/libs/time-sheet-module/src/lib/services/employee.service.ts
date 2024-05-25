import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { RepositoryService } from '../../../../shared/infra/services/repository.service';
import { Employee } from '../models/employee';
import { Observable, map } from 'rxjs';

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
