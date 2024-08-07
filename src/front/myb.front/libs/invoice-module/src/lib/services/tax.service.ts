import { Injectable } from '@angular/core';
import { Tax } from '../models/tax.model';
import { RepositoryService } from 'libs/shared/infra/services/repository.service';
import { Apollo } from 'apollo-angular';
import { BehaviorSubject, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TaxService extends RepositoryService<Tax> {
  private taxSubject = new BehaviorSubject<Tax[]>([]);
  public taxes$ = this.taxSubject.asObservable();
  
  constructor(apollo: Apollo) {
    super(apollo, 'Tax');
    this.loadInitialTaxes();
  }

  private loadInitialTaxes(): void {
    this.getAll().subscribe((taxes) => this.taxSubject.next(taxes));
  }


  protected override mapAllItems(result: any): Tax[] {
    return result.data?.allTaxes || [];
  }

  protected override mapSingleItem(result: any): Tax {
    return result.data?.taxByID as Tax;
  }

  protected override mapCreateItem(result: any): Tax {
    return result.data?.addTax as Tax;
  }

  protected override mapUpdateItem(result: any): Tax {
    return result.data?.updateTax as Tax;
  }

  protected override mapDeleteResult(result: any): boolean {
    return result.data?.deleteTax === true;
  }

  override getAll(): Observable<Tax[]> {
    return super.getAll().pipe(
      map((taxes) => {
        console.log('Taxs', taxes);
        this.taxSubject.next(taxes);
        return taxes;
      })
    );
  }
  override get(id: number): Observable<Tax> {
    return super.get(id).pipe(
      map((tax) => {
        return tax;
      })
    );
  }

  override create(item: Tax): Observable<Tax> {
    return super.create(item).pipe(
      map((newTax) => {
        const taxes = [...this.taxSubject.value, newTax];
        this.taxSubject.next(taxes);
        return newTax;
      })
    );
  }
}
