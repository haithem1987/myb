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
    this.loadInitialFolders();
  }
  public loadInitialFolders(): void {
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
    return super.getAll().pipe(
      map((folders) => {
        this.folderSubject.next(folders);
        return folders;
      })
    );
  }

  // Get folder by ID
  override get(id: number): Observable<Folder> {
    return this.apollo
      .watchQuery<{ folderById: Folder }>({
        query: GET_FOLDER_BY_ID,
        variables: { id },
      })
      .valueChanges.pipe(
        map((result: any) => {
          const folder = result.data.folderById;
          const currentFolders = this.folderSubject.value;
          const updatedFolders = currentFolders.map(f => f.id === folder.id ? folder : f);
          this.folderSubject.next(updatedFolders);
          return folder;
        })
      );
     
  }
  // override get(id: number): Observable<Folder> {
  //   return super.get(id).pipe(
  //     map((folder) => {
  //       const folders = this.folderSubject.value.map((p) =>
  //         p.id === id ? folder : p
  //       );
  //       this.folderSubject.next(folders);
  //       return folder;
  //     })
  //   );
  // }

  getFoldersByParentId(parentId: number): Observable<Folder[]> {
    return this.apollo.watchQuery({
      query:  gql`
        ${this.typeOperations.getFoldersByParentId}
      `,
      variables: { parentId }
    }).valueChanges.pipe(
      map((result: any) => {
        const folders = result.data.foldersByParentId;
        this.folderSubject.next(folders);
        return folders;
      })
    );
  }

  // Create folder
  override create(folder: Folder
  ): Observable<Folder> {
    return this.apollo
      .mutate<{ addFolder: Folder }>({
        mutation: gql`
        ${this.typeOperations.create}
      `,
        variables: { folder }
      })
      .pipe(
        map((result: any) => {
          const newFolder = result.data.addFolder;
          const currentFolders = this.folderSubject.value;
          this.folderSubject.next([...currentFolders, newFolder]);

          return newFolder;
        })
      );
      
  }

  // Update folder
  updateFolder(folder: Folder): Observable<Folder> {
    return super.update(folder.id, folder).pipe(
      map((updatedFolder) => {
        const updatedFolders = this.folderSubject.value.map(f =>
          f.id === updatedFolder.id ? updatedFolder : f
        );
        this.folderSubject.next(updatedFolders);
        return updatedFolder;
      })
    );
  }

  override delete(id: number): Observable<boolean> {
    return super.delete(id).pipe(
      map((success) => {
        if (success) {
          const folders = this.folderSubject.value.filter((t) => t.id !== id);
          this.folderSubject.next(folders);
          console.log('folders deleted',folders); 
        }
        return success;
      })
    );
  }

}
