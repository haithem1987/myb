import { Injectable } from '@angular/core';

import { Folder } from '../models/Folder';
import { Apollo, gql } from 'apollo-angular';
import { Observable, catchError, map, throwError } from 'rxjs';
import { GET_FOLDER_BY_ID } from '../GraphQl/Queries/Folder.graphql';
import { RepositoryService } from 'libs/shared/infra/services/repository.service';

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
  // Get folder by ID
  getById(id: number): Observable<Folder> {
    return this.apollo
      .watchQuery<{ folderById: Folder }>({
        query: GET_FOLDER_BY_ID,
        variables: { id },
        
      })
      .valueChanges.pipe(
        map((result: any) => result.data.folderById ,console.log(' getbyid' , id))
      
      );
  }

  
  // // Create folder
   // Create folder
  createFolder(folder: {  folderName: string; parentId?: number; createdBy: number; editedBy: number;createdAt:Date }): Observable<Folder> {
    console.log("type operation for folder",this.typeOperations.create);
    return this.apollo
      .mutate<{ addFolder: Folder }>({
        mutation: gql`
        ${this.typeOperations.create}
      `,
        variables: { folder }
      })
      .pipe(
        map((result: any) => result.data.addFolder)
      );
  }
  // Update folder
  updateFolder(folder: Folder): Observable<Folder> {
    return super.update(folder.id, folder).pipe(
      map((updatedFolder) => {
        return updatedFolder;
      })
    );
  }
}
