import { Injectable } from '@angular/core';
import { RepositoryService } from 'libs/shared/shared-ui/src/lib/services/repository.service';
import { DocumentModel } from '../models/DocumentModel'; 
import { Apollo, gql } from 'apollo-angular';
import { Observable, catchError, map, throwError } from 'rxjs';


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
override update(id: number, document: DocumentModel): Observable<DocumentModel> {
  return this.apollo
    .mutate({
      mutation: gql`
        ${this.typeOperations.update}
      `,
      variables: {
        id,
        item: document,
      },
    })
    .pipe(
      map((result: any) => result.data.updateDocument, console.log(document.id)),
     
      catchError((error) => {
        console.error('Error updating document:', error);
        return throwError(error);
      })
    );
}

//   override create(document: DocumentModel): Observable<DocumentModel> {
//   return this.apollo
//   .mutate({
//     mutation: gql`
//       ${this.typeOperations.create}
//     `,
//     variables: {
//       document: document,

//     },

//     })
//     .pipe(
//       map((result: any) => result.data.addDocument),
//       catchError((error) => {
//         console.error('Error creating document:', error);
//         return throwError(error);
//       })
//     );
// }



}