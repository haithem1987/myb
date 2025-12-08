import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';

import { BehaviorSubject, Observable, map } from 'rxjs';
import { RepositoryService } from 'libs/shared/infra/services/repository.service';
import { TimeOff } from '../models/timeoff.model';

@Injectable({
  providedIn: 'root',
})
export class TimeoffService extends RepositoryService<TimeOff> {
  private timeOffSubject = new BehaviorSubject<TimeOff[]>([]);
  public timeoffs$ = this.timeOffSubject.asObservable();
  constructor(apollo: Apollo) {
    super(apollo, 'TimeOff', 'timesheetService');
  }
  protected override mapAllItems(result: any): TimeOff[] {
    return result.data?.allEmployees || [];
  }

  protected override mapSingleItem(result: any): TimeOff {
    return result.data?.EmployeeById as TimeOff;
  }

  protected override mapCreateItem(result: any): TimeOff {
    return result.data?.addEmployee as TimeOff;
  }

  protected override mapUpdateItem(result: any): TimeOff {
    return result.data?.updateEmployee as TimeOff;
  }

  protected override mapDeleteResult(result: any): boolean {
    return result.data?.deleteEmployee === true;
  }

  override getAll(): Observable<TimeOff[]> {
    return super.getAll().pipe(
      map((timeoffs) => {
        console.log('timeoffs', timeoffs);
        this.timeOffSubject.next(timeoffs);
        return timeoffs;
      })
    );
  }

  override get(id: number): Observable<TimeOff> {
    return super.get(id).pipe(
      map((employee) => {
        const timeoffs = this.timeOffSubject.value.map((p) =>
          p.id === id ? employee : p
        );
        this.timeOffSubject.next(timeoffs);
        return employee;
      })
    );
  }

  override create(item: TimeOff): Observable<TimeOff> {
    return super.create(item).pipe(
      map((newEmployee) => {
        const timeoffs = [...this.timeOffSubject.value, newEmployee];
        this.timeOffSubject.next(timeoffs);
        return newEmployee;
      })
    );
  }

  override update(id: number, item: TimeOff): Observable<TimeOff> {
    return super.update(id, item).pipe(
      map((updatedEmployee) => {
        console.log('updatedEmployee', updatedEmployee);
        const timeoffs = this.timeOffSubject.value.map((t) =>
          t.id === id ? updatedEmployee : t
        );
        console.log(' updated timeoffs ', timeoffs);
        this.timeOffSubject.next(timeoffs);
        return updatedEmployee;
      })
    );
  }

  override delete(id: number): Observable<boolean> {
    return super.delete(id).pipe(
      map((success) => {
        if (success) {
          const timeoffs = this.timeOffSubject.value.filter((t) => t.id !== id);
          this.timeOffSubject.next(timeoffs);
        }
        return success;
      })
    );
  }

  getEmployeesByManagerId(managerId: string): Observable<TimeOff[]> {
    return this.apollo
      .watchQuery<{ employeesByManagerId: TimeOff[] }>({
        query: gql`
          ${this.typeOperations.getEmployeesByManagerId}
        `,
        variables: { managerId },
      })
      .valueChanges.pipe(
        map((result: any) => {
          const timeoffs = result.data.employeesByManagerId;
          this.timeOffSubject.next(timeoffs);
          return timeoffs;
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
          // const timeoffs = this.timeOffSubject.value.map((employee) =>
          //   employee.id === employeeId
          //     ? { ...employee, timeOffs: timeoffs }
          //     : employee
          // );
          // this.timeOffSubject.next(timeoffs);

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

          // // Update the employee's timeOffs in the timeOffSubject
          // const timeoffs = this.timeOffSubject.value.map((employee) => {
          //   if (employee.id === item.employeeId) {
          //     const updatedTimeOffs = employee.timeOffs?.map((timeOff) =>
          //       timeOff.id === item.id ? updatedTimeOff : timeOff
          //     );
          //     return { ...employee, timeOffs: updatedTimeOffs };
          //   }
          //   return employee;
          // });
          // this.timeOffSubject.next(timeoffs);

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
