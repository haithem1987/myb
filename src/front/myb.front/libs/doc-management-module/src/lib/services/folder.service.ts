import { Injectable } from '@angular/core';
import { RepositoryService } from 'libs/shared/shared-ui/src/lib/services/repository.service';
import { Folder } from '../models/Folder';
import { Apollo, gql } from 'apollo-angular';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FolderService extends RepositoryService<Folder> {
  constructor(apollo: Apollo) {
    super(apollo, 'Folder');
  }
  // Get all folders
  override getAll(): Observable<Folder[]> {
    return this.apollo
      .watchQuery<{ allFolders: Folder[] }>({
        query: gql`
          ${this.typeOperations.getAll}
        `,
      })
      .valueChanges.pipe(
        map((result: any) => result.data.allFolders)
      );
  }
}
