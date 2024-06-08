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
  public tasks$ = this.documentSubject.asObservable();
constructor(apollo: Apollo) {
    super(apollo, 'DocumentModel');
}
private loadInitialTasks(): void {
  this.getAll().subscribe((tasks) => this.documentSubject.next(tasks));
}

protected override mapAllItems(result: any): DocumentModel[] {
  return result.data?.allDocuments || [];
}

protected override mapSingleItem(result: any): DocumentModel {
  return result.data?.TaskById as DocumentModel;
}

protected override mapCreateItem(result: any): DocumentModel {
  return result.data?.addDocument as DocumentModel;
}

protected override mapUpdateItem(result: any): DocumentModel {
  return result.data?.updateTask as DocumentModel;
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
        const  document = this.documentSubject.value.filter((t) => t.id !== id);
        this.documentSubject.next( document);
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
      query DocumentsByFolderId($folderId: Int!) {
        documentsByFolderId(folderId: $folderId) {
          id
          documentName
          createdBy
          editedBy
          documentType
          status
          documentSize
          createdAt
          updatedAt
          folderId
        }
      }
    `,
    variables: {
      folderId,
    },
  }).valueChanges.pipe(
    map((result: any) => result.data.documentsByFolderId)
  );
}

createDocument(document: DocumentModel): Observable<DocumentModel> {
  let documenttest =document;
  console.log("this document test",documenttest);
  // console.log("type operation",this.typeOperations.create);
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
        mutation UpdateDocument($id: Int!, $document: DocumentModelInput!) {
          updateDocument(id: $id, document: $document) {
            id
            documentName
            documentType
            createdBy
            editedBy
            folderId
            documentSize
            status
            createdAt
            updatedAt
            file
          }
        }
      `,
      variables: { id: document.id, document: { ...document, id: undefined } }, // Ensure id is included separately
    })
 
    .pipe(
      map((result: any) => { console.log(result.data); return result.data.updateDocument})
    );
}
}