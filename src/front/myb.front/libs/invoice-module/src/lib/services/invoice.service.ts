import { Injectable } from '@angular/core';
import { RepositoryService } from '../../../../shared/infra/services/repository.service';
import { Invoice } from '../models/invoice.model';
import { Apollo, gql } from 'apollo-angular';
import { BehaviorSubject, Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService extends RepositoryService<Invoice> {
  private invoiceSubject = new BehaviorSubject<Invoice[]>([]);
  public invoices$ = this.invoiceSubject.asObservable();

  constructor(apollo: Apollo) {
    super(apollo, 'Invoice');
    this.loadInitialInvoices();
  }

  private loadInitialInvoices(): void {
    this.getAll().subscribe((products) => this.invoiceSubject.next(products));
  }

  protected override mapAllItems(result: any): Invoice[] {
    return result.data?.allInvoices || [];
  }

  protected override mapCreateItem(result: any): Invoice {
    return result.data?.addInvoice as Invoice;
  }
  protected override mapSingleItem(result: any): Invoice {
    return result.data?.invoiceByID as Invoice;
  }

  protected override mapUpdateItem(result: any): Invoice {
    console.log('updated', result.data);
    return result.data?.updateInvoice as Invoice;
  }

  override getAll(): Observable<Invoice[]> {
    return super.getAll().pipe(
      map((invoices) => {
        console.log('invoices', invoices);
        this.invoiceSubject.next(invoices);
        return invoices;
      })
    );
  }
  override get(id: number): Observable<Invoice> {
    return super.get(id).pipe(
      map((invoice) => {
        console.log('invoice', invoice);
        return invoice;
      })
    );
  }

  override create(item: Invoice): Observable<Invoice> {
    return super.create(item).pipe(
      map((newInvoice) => {
        const invoices = [...this.invoiceSubject.value, newInvoice];
        this.invoiceSubject.next(invoices);
        console.log('new invoice', newInvoice);
        return newInvoice;
      })
    );
  }

  override update(id: number, item: Invoice): Observable<Invoice> {
    return super.update(id, item).pipe(
      map((updatedInvoice) => {
        const products = this.invoiceSubject.value.map((i) =>
          i.id === id ? updatedInvoice : i
        );
        this.invoiceSubject.next(products);
        return updatedInvoice;
      })
    );
  }
}
