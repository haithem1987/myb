import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Timesheet } from '../models/timesheet.model';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { RepositoryService } from 'libs/shared/infra/services/repository.service';

@Injectable({
  providedIn: 'root',
})
export class TimesheetService extends RepositoryService<Timesheet> {
  private timesheetSubject = new BehaviorSubject<Timesheet[]>([]);
  public timesheets$ = this.timesheetSubject.asObservable();
  constructor(apollo: Apollo) {
    super(apollo, 'Timesheet');
  }

  protected override mapAllItems(result: any): Timesheet[] {
    return result.data?.allTimesheets || [];
  }

  protected override mapSingleItem(result: any): Timesheet {
    return result.data?.TimesheetById as Timesheet;
  }

  protected override mapCreateItem(result: any): Timesheet {
    return result.data?.addTimesheet as Timesheet;
  }

  protected override mapUpdateItem(result: any): Timesheet {
    return result.data?.updateTimesheet as Timesheet;
  }

  protected override mapDeleteResult(result: any): boolean {
    return result.data?.deleteTimesheet === true;
  }

  getTimesheetsByUserId(userId: string): Observable<Timesheet[]> {
    return this.apollo
      .watchQuery<{ timesheetsByUserId: Timesheet[] }>({
        query: gql`
          ${this.typeOperations.getTimesheetsByUserId}
        `,
        variables: { userId },
      })
      .valueChanges.pipe(
        map((result: any) => {
          const timesheets = result.data.timesheetsByUserId;
          this.timesheetSubject.next(timesheets);
          return timesheets;
        }) // Map to the allTimesheets property
      );
  }
  getTimesheetsByEmployeeId(employeeId: number): Observable<Timesheet[]> {
    return this.apollo
      .watchQuery<{ timesheetsByEmployeeId: Timesheet[] }>({
        query: gql`
          ${this.typeOperations.getTimesheetsByEmployeeId}
        `,
        variables: { employeeId },
      })
      .valueChanges.pipe(
        map((result: any) => {
          console.log('result', result);
          const timesheets = result.data.timesheetsByEmployeeId;
          return timesheets;
        }) // Map to the allTimesheets property
      );
  }

  updateMultipleTimesheets(timesheets: Timesheet[]): Observable<Timesheet[]> {
    return this.apollo
      .mutate<{ updateMultipleTimesheets: Timesheet[] }>({
        mutation: gql`
          ${this.typeOperations.updateMultipleTimesheets}
        `,
        variables: { timesheets },
      })
      .pipe(
        map((result: any) => {
          const updatedTimesheets = result.data.updateMultipleTimesheets;
          // Make a mutable copy of the existing timesheets
          const existingTimesheets = [...this.timesheetSubject.value];
          updatedTimesheets.forEach((updated: Timesheet) => {
            const index = existingTimesheets.findIndex(
              (ts) => ts.id === updated.id
            );
            if (index !== -1) {
              existingTimesheets[index] = updated;
            }
          });
          this.timesheetSubject.next(existingTimesheets);
          return updatedTimesheets;
        })
      );
  }
  override getAll(): Observable<Timesheet[]> {
    return super.getAll().pipe(
      map((timesheets) => {
        console.log('timesheets', timesheets);
        this.timesheetSubject.next(timesheets);
        return timesheets;
      })
    );
  }
  override get(id: number): Observable<Timesheet> {
    return super.get(id).pipe(
      map((project) => {
        const timesheets = this.timesheetSubject.value.map((p) =>
          p.id === id ? project : p
        );
        this.timesheetSubject.next(timesheets);
        return project;
      })
    );
  }

  override create(item: Timesheet): Observable<Timesheet> {
    return super.create(item).pipe(
      map((newTimesheet) => {
        const timesheets = [...this.timesheetSubject.value, newTimesheet];
        this.timesheetSubject.next(timesheets);
        return newTimesheet;
      })
    );
  }

  override update(id: number, item: Timesheet): Observable<Timesheet> {
    return super.update(id, item).pipe(
      map((updatedTimesheet) => {
        const timesheets = this.timesheetSubject.value.map((t) =>
          t.id === id ? updatedTimesheet : t
        );
        this.timesheetSubject.next(timesheets);
        return updatedTimesheet;
      })
    );
  }

  override delete(id: number): Observable<boolean> {
    return super.delete(id).pipe(
      map((success) => {
        if (success) {
          const timesheets = this.timesheetSubject.value.filter(
            (t) => t.id !== id
          );
          this.timesheetSubject.next(timesheets);
        }
        return success;
      })
    );
  }
}
