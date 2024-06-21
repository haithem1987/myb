import { DocumentVersion } from './../models/DocumentVersion';
import { Injectable } from '@angular/core';

import { DocumentModel } from '../models/DocumentModel'; 
import { Apollo, gql } from 'apollo-angular';
import { BehaviorSubject, Observable, catchError, map, throwError } from 'rxjs';
import { DocumentStatus } from '../models/DocumentStatus';
import { ApolloError } from '@apollo/client';
import { RepositoryService } from 'libs/shared/infra/services/repository.service';


@Injectable({
  providedIn: 'root',
})
export class DocumentService extends RepositoryService<DocumentModel> {
  private documentSubject = new BehaviorSubject<DocumentModel[]>([]);
  public documents$ = this.documentSubject.asObservable();
constructor(apollo: Apollo) {
    super(apollo, 'DocumentModel');
}
private loadInitialdocuments(): void {
  this.getAll().subscribe((documents) => this.documentSubject.next(documents));
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
//get all doc 
// override getAll(): Observable<DocumentModel[]> {
//     return this.apollo
//         .watchQuery<{ allDocuments: DocumentModel[] }>({
//             query: gql`
//                 ${this.typeOperations.getAll}
//             `,
//         })
//         .valueChanges.pipe(
//             map((result: any) => result.data) 
//         );
// }
override getAll(): Observable<DocumentModel[]> {
  return super.getAll().pipe(
    map((documents) => {
      console.log('documents', documents);
      this.documentSubject.next(documents);
      return documents;
    })
  );
}

//delete document
// override delete(id: number): Observable<DocumentModel> {
//     return  this.apollo
//         .mutate({
//             mutation: gql`
//             ${this.typeOperations.delete}
//             `,
//             variables: {
//                 id: id,
//             },
//         })
//         .pipe(
//             map((result: any) => result.data.deleteDocument )
//         );
// }
override delete(id: number): Observable<boolean> {
  return super.delete(id).pipe(
    map((success) => {
      if (success) {
        const  documents = this.documentSubject.value.filter((t) => t.id !== id);
        this.documentSubject.next( documents);
      }
      return success;
    })
  );
}
//update document
// override update(id: number, document: DocumentModel): Observable<DocumentModel> {
//   return this.apollo
//     .mutate({
//       mutation: gql`
//         ${this.typeOperations.update}
//       `,
//       variables: {
//         id,
//         item: document,
//       },
//     })
//     .pipe(
//       map((result: any) => result.data.updateDocument, console.log(document.id)),
     
//       catchError((error) => {
//         console.error('Error updating document:', error);
//         return throwError(error);
//       })
//     );
// }



getDocumentsByFolderId(folderId: number): Observable<DocumentModel[]> {
  return this.apollo.watchQuery<{ documentsByFolderId: DocumentModel[] }>({
    query: gql`
    ${this.typeOperations.documentsByFolderId}
  `,
    variables: {
      folderId,
    },
  }).valueChanges.pipe(
    // map((result: any) => result.data.documentsByFolderId)
    map((result: any) => {
      const documents = result.data.documentsByFolderId;
      this.documentSubject.next(documents);
      return documents;
    })
  );
}

createDocument(document: DocumentModel): Observable<DocumentModel> {
  let documenttest =document;
  console.log("this document test",documenttest);
  return this.apollo
    .mutate<{ addDocument: DocumentModel }>({
      mutation: gql`
      ${this.typeOperations.create}
    `,
      variables: { document }
    })
    .pipe(
      map((result: any) => { console.log(result.data); return result.data.addDocument})
      
    );
}


updateDocument(document: DocumentModel): Observable<DocumentModel> {
  return this.apollo
    .mutate<{ updateDocument: DocumentModel }>({
      mutation: gql`
         ${this.typeOperations.update}
      `,
      variables: { 
        id: document.id, 
        document: { ...document, id: undefined } }, 
    })
 
    .pipe(
      map((result: any) => { console.log(result.data); return result.data.updateDocument})
    );
}
}