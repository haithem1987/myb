import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { RepositoryService } from 'libs/shared/shared-ui/src/lib/services/repository.service';
import { Project } from '../models/project.model';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProjectService extends RepositoryService<Project> {
  constructor(apollo: Apollo) {
    super(apollo, 'Project');
  }
  override getAll(): Observable<Project[]> {
    return this.apollo
      .watchQuery<{ allProjects: Project[] }>({
        query: gql`
          ${this.typeOperations.getAll}
        `,
      })
      .valueChanges.pipe(
        map((result: any) => result.data.allProjects) // Map to the allTasks property
      );
  }
  override get(id: number): Observable<Project> {
    return this.apollo
      .watchQuery<{ projectById: Project }>({
        query: gql`
          ${this.typeOperations.getById}
        `,
        variables: { id },
      })
      .valueChanges.pipe(
        map((result: any) => result.data.projectById) // Map to the allTasks property
      );
  }
}
