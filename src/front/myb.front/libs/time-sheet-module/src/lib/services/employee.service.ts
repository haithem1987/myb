import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';

import { BehaviorSubject, Observable, map } from 'rxjs';
import { RepositoryService } from 'libs/shared/infra/services/repository.service';
import { Employee } from '../models/employee';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService extends RepositoryService<Employee> {
  private employeeSubject = new BehaviorSubject<Employee[]>([]);
  public employees$ = this.employeeSubject.asObservable();
  constructor(apollo: Apollo) {
    super(apollo, 'Employee');
  }
  protected override mapAllItems(result: any): Employee[] {
    return result.data?.allEmployees || [];
  }

  protected override mapSingleItem(result: any): Employee {
    return result.data?.EmployeeById as Employee;
  }

  protected override mapCreateItem(result: any): Employee {
    return result.data?.addEmployee as Employee;
  }

  protected override mapUpdateItem(result: any): Employee {
    return result.data?.updateEmployee as Employee;
  }

  protected override mapDeleteResult(result: any): boolean {
    return result.data?.deleteEmployee === true;
  }

  override getAll(): Observable<Employee[]> {
    return super.getAll().pipe(
      map((employees) => {
        console.log('employees', employees);
        this.employeeSubject.next(employees);
        return employees;
      })
    );
  }

  override get(id: number): Observable<Employee> {
    return super.get(id).pipe(
      map((employee) => {
        const employees = this.employeeSubject.value.map((p) =>
          p.id === id ? employee : p
        );
        this.employeeSubject.next(employees);
        return employee;
      })
    );
  }

  override create(item: Employee): Observable<Employee> {
    return super.create(item).pipe(
      map((newEmployee) => {
        const employees = [...this.employeeSubject.value, newEmployee];
        this.employeeSubject.next(employees);
        return newEmployee;
      })
    );
  }

  override update(id: number, item: Employee): Observable<Employee> {
    return super.update(id, item).pipe(
      map((updatedEmployee) => {
        console.log('updatedEmployee', updatedEmployee);
        const employees = this.employeeSubject.value.map((t) =>
          t.id === id ? updatedEmployee : t
        );
        console.log(' updated employees ', employees);
        this.employeeSubject.next(employees);
        return updatedEmployee;
      })
    );
  }

  override delete(id: number): Observable<boolean> {
    return super.delete(id).pipe(
      map((success) => {
        if (success) {
          const employees = this.employeeSubject.value.filter(
            (t) => t.id !== id
          );
          this.employeeSubject.next(employees);
        }
        return success;
      })
    );
  }

  getEmployeesByManagerId(managerId: string): Observable<Employee[]> {
    return this.apollo
      .watchQuery<{ employeesByManagerId: Employee[] }>({
        query: gql`
          ${this.typeOperations.getEmployeesByManagerId}
        `,
        variables: { managerId },
      })
      .valueChanges.pipe(
        map((result: any) => {
          const employees = result.data.employeesByManagerId;
          this.employeeSubject.next(employees);
          return employees;
        })
      );
  }
}
