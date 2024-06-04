import { DocumentVersion } from './../models/DocumentVersion';
import { Injectable } from '@angular/core';
import { RepositoryService } from 'libs/shared/shared-ui/src/lib/services/repository.service';
import { DocumentModel } from '../models/DocumentModel'; 
import { Apollo, gql } from 'apollo-angular';
import { Observable, catchError, map, throwError } from 'rxjs';
import { DocumentStatus } from '../models/DocumentStatus';
import { ApolloError } from '@apollo/client';


@Injectable({
  providedIn: 'root',
})
export class DocumentService extends RepositoryService<DocumentModel> {
constructor(apollo: Apollo) {
    super(apollo, 'DocumentModel');
}

//get all doc 
override getAll(): Observable<DocumentModel[]> {
    return this.apollo
        .watchQuery<{ allDocuments: DocumentModel[] }>({
            query: gql`
                ${this.typeOperations.getAll}
            `,
        })
        .valueChanges.pipe(
            map((result: any) => result.data) 
        );
}

//delete document
override delete(id: number): Observable<DocumentModel> {
    return  this.apollo
        .mutate({
            mutation: gql`
            ${this.typeOperations.delete}
            `,
            variables: {
                id: id,
            },
        })
        .pipe(
            map((result: any) => result.data.deleteDocument )
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



//create document

// createDocument(document: any) {
//   const createDocumentMutation = gql`
//     mutation CreateDocument($input: DocumentInput!) {
//       createDocument(input: $input) {
//         id
//         documentName
//         documentType
//         folderId
//         createdBy
//         editedBy
//       }
//     }
//   `;

//   return this.apollo.mutate({
//     mutation: createDocumentMutation,
//     variables: {
//       input: document
//     }
//   });
// }


}