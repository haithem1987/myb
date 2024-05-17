import { Injectable } from '@angular/core';
import { RepositoryService } from 'libs/shared/shared-ui/src/lib/services/repository.service';
import { Invoice } from '../models/invoice.model';
import { Apollo, gql } from 'apollo-angular';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService extends RepositoryService<Invoice> {
  constructor(apollo: Apollo) {
    super(apollo, 'Invoice');
  } 
  override getAll(): Observable<Invoice[]> {
    return this.apollo
      .watchQuery<{ allInvoices: Invoice[] }>({
        query: gql`
          ${this.typeOperations.getAll}
        `,
      })
      .valueChanges.pipe(
        map((result: any) => result.data.allInvoices));
  } 
}
