import { Injectable } from '@angular/core';
import { DocumentModel } from '../models/DocumentModel';
import { Apollo, gql } from 'apollo-angular';
import { BehaviorSubject, Observable, catchError, map, throwError } from 'rxjs';
import { RepositoryService } from 'libs/shared/infra/services/repository.service';

@Injectable({
  providedIn: 'root',
})
export class DocumentService extends RepositoryService<DocumentModel> {
  private documentSubject = new BehaviorSubject<DocumentModel[]>([]);
  public documents$ = this.documentSubject.asObservable();

  constructor(apollo: Apollo) {
    super(apollo, 'DocumentModel', 'documentService');
    this.loadInitialdocuments();
  }
  private loadInitialdocuments(): void {
    this.getAll().subscribe((documents) =>
      this.documentSubject.next(documents)
    );
  }

  protected override mapAllItems(result: any): DocumentModel[] {
    return result.data?.allDocuments || [];
  }

  protected override mapSingleItem(result: any): DocumentModel {
    return result.data?.DocumentById as DocumentModel;
  }

  protected override mapCreateItem(result: any): DocumentModel {
    return result.data?.addDocument as DocumentModel;
  }

  protected override mapUpdateItem(result: any): DocumentModel {
    return result.data?.updateDocument as DocumentModel;
  }

  protected override mapDeleteResult(result: any): boolean {
    return result.data?.deleteDocument === true;
  }

  override getAll(): Observable<DocumentModel[]> {
    return super.getAll().pipe(
      map((documents) => {
        console.log('documents for getall', documents);
        this.documentSubject.next(documents);
        return documents;
      })
    );
  }

  override delete(id: number): Observable<boolean> {
    return super.delete(id).pipe(
      map((success) => {
        if (success) {
          const documents = this.documentSubject.value.filter(
            (t) => t.id !== id
          );
          this.documentSubject.next(documents);
        }
        return success;
      })
    );
  }

  override create(item: DocumentModel): Observable<DocumentModel> {
    return super.create(item).pipe(
      map((newDocument) => {
        const documents = [...this.documentSubject.value, newDocument];
        this.documentSubject.next(documents);
        console.log('first', newDocument);

        return newDocument;
      })
    );
  }

  override update(id: number, item: DocumentModel): Observable<DocumentModel> {
    return super.update(id, item).pipe(
      map((updatedDoc) => {
        const documents = this.documentSubject.value.map((t) =>
          t.id === id ? updatedDoc : t
        );
        this.documentSubject.next(documents);
        return updatedDoc;
      })
    );
  }
}
