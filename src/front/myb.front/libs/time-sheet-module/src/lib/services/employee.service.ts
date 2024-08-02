import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';

import { BehaviorSubject, Observable, map } from 'rxjs';
import { RepositoryService } from 'libs/shared/infra/services/repository.service';
import { Employee } from '../models/employee';
import { TimeOff } from '../models/timeoff.model';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService extends RepositoryService<Employee> {
  private employeeSubject = new BehaviorSubject<Employee[]>([]);
  public employees$ = this.employeeSubject.asObservable();
  private timeOffSubject = new BehaviorSubject<TimeOff[]>([]);
  public timeoffs$ = this.timeOffSubject.asObservable();
  constructor(apollo: Apollo) {
    super(apollo, 'Employee');
  }
  protected override mapAllItems(result: any): Employee[] {
    return result.data?.allEmployees || [];
  }

  protected override mapSingleItem(result: any): Employee {
    return result.data?.employeeById as Employee;
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
        // const employees = this.employeeSubject.value.map((p) =>
        //   p.id === id ? employee : p
        // );
        // this.employeeSubject.next(employees);
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
  getTimeOffsByEmployeeId(employeeId: number): Observable<TimeOff[]> {
    return this.apollo
      .watchQuery<{ timeOffsByEmployeeId: TimeOff[] }>({
        query: gql`
          ${this.typeOperations.getTimeoffsByEmployeeId}
        `,
        variables: { employeeId },
      })
      .valueChanges.pipe(
        map((result: any) => {
          console.log('employeeId', employeeId);
          const timeoffs = result.data.timeOffsByEmployeeId;
          console.log('timeoffs', timeoffs);
          // // Update the employee's timeOffs
          // const employees = this.employeeSubject.value.map((employee) =>
          //   employee.id === employeeId
          //     ? { ...employee, timeOffs: timeoffs }
          //     : employee
          // );
          // this.employeeSubject.next(employees);

          // Update the timeOffSubject with the latest time-offs
          this.timeOffSubject.next(timeoffs);

          return timeoffs;
        })
      );
  }

  updateTimeOff(item: TimeOff): Observable<TimeOff> {
    return this.apollo
      .mutate<{ updateTimeOff: TimeOff }>({
        mutation: gql`
          ${this.typeOperations.updateTimeOff}
        `,
        variables: { item },
      })
      .pipe(
        map((result: any) => {
          const updatedTimeOff = result.data.updateTimeOff;

          // // Update the employee's timeOffs in the employeeSubject
          // const employees = this.employeeSubject.value.map((employee) => {
          //   if (employee.id === item.employeeId) {
          //     const updatedTimeOffs = employee.timeOffs?.map((timeOff) =>
          //       timeOff.id === item.id ? updatedTimeOff : timeOff
          //     );
          //     return { ...employee, timeOffs: updatedTimeOffs };
          //   }
          //   return employee;
          // });
          // this.employeeSubject.next(employees);

          // Update the timeOffSubject with the latest time-offs
          const timeoffs = this.timeOffSubject.value.map((timeOff) =>
            timeOff.id === item.id ? updatedTimeOff : timeOff
          );
          this.timeOffSubject.next(timeoffs);

          return updatedTimeOff;
        })
      );
  }
}
