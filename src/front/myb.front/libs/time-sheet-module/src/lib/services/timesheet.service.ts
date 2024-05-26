import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Timesheet } from '../models/timesheet.model';
import { Observable, map } from 'rxjs';
import { RepositoryService } from 'libs/shared/infra/services/repository.service';

@Injectable({
  providedIn: 'root',
})
export class TimesheetService extends RepositoryService<Timesheet> {
  constructor(apollo: Apollo) {
    super(apollo, 'Timesheet');
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
        map((result: any) => result.data.timesheetsByUserId) // Map to the allTasks property
      );
  }
}
