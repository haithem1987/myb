import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { RepositoryService } from '../../../../shared/infra/services/repository.service';
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
}
