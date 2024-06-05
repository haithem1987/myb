import { Injectable } from '@angular/core';

import { Folder } from '../models/Folder';
import { Apollo, gql } from 'apollo-angular';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ADD_FOLDER, DELETE_FOLDER } from '../GraphQl/Mutations/FolderMutation';
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
  // createFolder(folderName: string): Observable<Folder> {
  //   return this.apollo
  //     .mutate<{ createFolder: Folder }>({
  //       mutation: gql`
  //      ${this.typeOperations.addFolder}
      
  //       `,
  //       variables: { folderName }
  //     })
  //     .pipe(
  //       map((result: any) => result.data.createFolder)
  //     );
  // }

  // createFolder(folderName: any): Observable<Folder> {
  //   return this.apollo
  //     .mutate<{ addFolder: Folder }>({
  //       mutation: ADD_FOLDER,
  //       variables: { folderName: { folderName } }
  //     })
  //     .pipe(
  //       map((result: any) => result.data.addFolder)
  //     );
  // }
   // Create folder
  createFolder(folder: { id: number; folderName: string; parentId?: number; createdBy: number; editedBy: number }): Observable<Folder> {
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
  // override update(folder: Folder): Observable<Folder> {
  //   return this.apollo
  //     .mutate<{ updateFolder: Folder }>({
  //       mutation: gql`
  //       ${this.typeOperations.update}
  //     `,
  //       variables: { folder }
  //     })
  //     .pipe(
  //       map((result: any) => result.data.updateFolder)
  //     );
  // }
}
