import { Injectable } from '@angular/core';

import { Folder } from '../models/Folder';
import { Apollo, gql } from 'apollo-angular';
import { BehaviorSubject, Observable, catchError, map, throwError } from 'rxjs';
import {
  GET_FOLDERS_BY_PARENT_ID,
  GET_FOLDER_BY_ID,
} from '../GraphQl/Queries/Folder.graphql';
import { RepositoryService } from 'libs/shared/infra/services/repository.service';

@Injectable({
  providedIn: 'root',
})
export class FolderService extends RepositoryService<Folder> {
  private folderSubject = new BehaviorSubject<Folder[]>([]);
  public folders$ = this.folderSubject.asObservable();

  constructor(apollo: Apollo) {
    super(apollo, 'Folder', 'documentService');
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

  override getAll(): Observable<Folder[]> {
    return super.getAll().pipe(
      map((folders) => {
        this.folderSubject.next(folders);
        return folders;
      })
    );
  }

  override get(id: number): Observable<Folder> {
    return this.apollo
      .watchQuery<{ folderById: Folder }>({
        query: GET_FOLDER_BY_ID,
        variables: { id },
        context: {
          service: 'documentService',
        },
      })
      .valueChanges.pipe(
        map((result: any) => {
          const folder = result.data.folderById;
          const currentFolders = this.folderSubject.value;
          const updatedFolders = currentFolders.map((f) =>
            f.id === folder.id ? folder : f
          );
          this.folderSubject.next(updatedFolders);
          console.log('folder serv', folder);
          return folder;
        })
      );
  }

  getFoldersByParentId(parentId: number): Observable<Folder[]> {
    return this.apollo
      .watchQuery({
        query: gql`
          ${this.typeOperations.getFoldersByParentId}
        `,
        variables: { parentId },
        context: {
          service: 'documentService',
        },
      })
      .valueChanges.pipe(
        map((result: any) => {
          const folders = result.data.foldersByParentId;
          this.folderSubject.next(folders);
          return folders;
        })
      );
  }

  override create(item: Folder): Observable<Folder> {
    return super.create(item).pipe(
      map((newFolder) => {
        const folders = [...this.folderSubject.value, newFolder];
        this.folderSubject.next(folders);
        return newFolder;
      })
    );
  }

  override update(id: number, item: Folder): Observable<Folder> {
    return super.update(id, item).pipe(
      map((updatedFolder) => {
        const folders = this.folderSubject.value.map((f) =>
          f.id === id ? updatedFolder : f
        );
        this.folderSubject.next(folders);
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
          console.log('folders deleted', folders);
        }
        return success;
      })
    );
  }
}
