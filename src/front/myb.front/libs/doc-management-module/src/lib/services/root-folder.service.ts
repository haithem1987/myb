import { Injectable } from '@angular/core';
import { Apollo ,gql} from 'apollo-angular';
import { RootFolder } from '../models/RootFolder';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RepositoryService } from 'libs/shared/infra/services/repository.service';
import { GET_ROOT_FOLDER_BY_USER_AND_MODULE } from '../GraphQl/Queries/Folder.graphql';

@Injectable({
  providedIn: 'root',
})
export class RootFolderService extends RepositoryService<RootFolder> {
  private rootFoldersSubject = new BehaviorSubject<RootFolder[]>([]);
  public rootFolders$ = this.rootFoldersSubject.asObservable();

  constructor(apollo: Apollo) {
    super(apollo, 'RootFolder');
    this.loadInitialRootFolders();
  }

  private loadInitialRootFolders(): void {
    this.getAll().subscribe((rootFolders) => this.rootFoldersSubject.next(rootFolders));
  }

  protected override mapAllItems(result: any): RootFolder[] {
    return result.data?.allRootFolders || [];
  }

  protected override mapSingleItem(result: any): RootFolder {
    return result.data?.rootFolderById as RootFolder;
  }

  protected override mapCreateItem(result: any): RootFolder {
    return result.data?.addRootFolder as RootFolder;
  }

  protected override mapUpdateItem(result: any): RootFolder {
    return result.data?.updateRootFolder as RootFolder;
  }

  protected override mapDeleteResult(result: any): boolean {
    return result.data?.deleteRootFolder === true;
  }

  override getAll(): Observable<RootFolder[]> {
    return super.getAll().pipe(
      map((rootFolders) => {
        this.rootFoldersSubject.next(rootFolders);
        return rootFolders;
      })
    );
  }

  override get(id: number): Observable<RootFolder> {
    return super.get(id).pipe(
      map((rootFolder) => {
        const rootFolders = this.rootFoldersSubject.value.map((rf) =>
          rf.id === id ? rootFolder : rf
        );
        this.rootFoldersSubject.next(rootFolders);
        return rootFolder;
      })
    );
  }

  getRootFolderByUserIdAndModuleName(userId: string, moduleName: string): Observable<RootFolder> {
    return this.apollo.watchQuery({
      query:  GET_ROOT_FOLDER_BY_USER_AND_MODULE,
      variables: { userId, moduleName }
    }).valueChanges.pipe(
      map((result: any) => {
        const rfolders = result.data.rootFolderByUserIdAndModuleName;
        this.rootFoldersSubject.next(rfolders);
        return rfolders;
      })
    );
  }

  override create(item: RootFolder): Observable<RootFolder> {
    return super.create(item).pipe(
      map((result: any) => {
        const newRootFolder = result.data.addRootFolder;
        const currentRootFolders = this.rootFoldersSubject.value;
        this.rootFoldersSubject.next([...currentRootFolders, newRootFolder]);

        return newRootFolder;
      })
    );
  }

  override update(id: number, item: RootFolder): Observable<RootFolder> {
    return super.update(id, item).pipe(
      map((updatedRootFolder) => {
        const rootFolders = this.rootFoldersSubject.value.map((rf) =>
          rf.id === id ? updatedRootFolder : rf
        );
        this.rootFoldersSubject.next(rootFolders);
        return updatedRootFolder;
      })
    );
  }

  override delete(id: number): Observable<boolean> {
    return super.delete(id).pipe(
      map((success) => {
        if (success) {
          const rootFolders = this.rootFoldersSubject.value.filter(
            (rf) => rf.id !== id
          );
          this.rootFoldersSubject.next(rootFolders);
        }
        return success;
      })
    );
  }

  
}
