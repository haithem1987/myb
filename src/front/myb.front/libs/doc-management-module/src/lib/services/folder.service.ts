import { Injectable } from '@angular/core';

import { Folder } from '../models/Folder';
import { Apollo, gql } from 'apollo-angular';
import { BehaviorSubject, Observable, catchError, map, throwError } from 'rxjs';
import { GET_FOLDERS_BY_PARENT_ID, GET_FOLDER_BY_ID } from '../GraphQl/Queries/Folder.graphql';
import { RepositoryService } from 'libs/shared/infra/services/repository.service';

@Injectable({
  providedIn: 'root'
})
export class FolderService extends RepositoryService<Folder> {
  private folderSubject = new BehaviorSubject<Folder[]>([]);
  public folders$ = this.folderSubject.asObservable();
constructor(apollo: Apollo) {
    super(apollo, 'Folder');
}
private loadInitialfolders(): void {
  this.getAll().subscribe((folders) => this.folderSubject.next(folders));
}

protected override mapAllItems(result: any): Folder[] {
  return result.data?.allFolders || [];
}

protected override mapSingleItem(result: any): Folder {
  return result.data?.FolderById as Folder;
}

protected override mapCreateItem(result: any): Folder {
  return result.data?.addFolder as Folder;
}

protected override mapUpdateItem(result: any): Folder {
  return result.data?.updateFolder as Folder;
}

protected override mapDeleteResult(result: any): boolean {
  return result.data?.deleteFolder === true;
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
        map((result: any) => result.data.allFolders,console.log(' get allllll' ))
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
  getFoldersByParentId(parentId: number): Observable<Folder[]> {
    return this.apollo.query({
      query: GET_FOLDERS_BY_PARENT_ID,
      variables: { parentId }
    }).pipe(
      map((result: any) => result.data.foldersByParentId,console.log(' getfolderbyparentid' , parentId))

    );
  }
  

   // Create folder
  createFolder(folder: {  
    folderName: string;
    parentId?: number;
    createdBy: number;
    editedBy: number;
    createdAt: Date;
    updatedAt: Date;
  }): Observable<Folder> {
    // console.log("type operation for folder",this.typeOperations.create);
    return this.apollo
      .mutate<{ addFolder: Folder }>({
        mutation: gql`
        ${this.typeOperations.create}
      `,
        variables: { folder  }
      })
      .pipe(
        map((result: any) => result.data.addFolder,console.log(' folder service parent id' , folder.parentId ))
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



  // Other methods...

}
