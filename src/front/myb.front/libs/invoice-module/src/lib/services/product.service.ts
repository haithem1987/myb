import { Injectable } from '@angular/core';
import { RepositoryService } from 'libs/shared/infra/services/repository.service';
import { Product } from '../models/product.model';
import { Apollo } from 'apollo-angular';
import { BehaviorSubject, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService extends RepositoryService<Product>{

  private productSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productSubject.asObservable();

  constructor(apollo: Apollo) {
    super(apollo, 'Product');
    this.loadInitialProducts();
  }

  private loadInitialProducts(): void {
    this.getAll().subscribe((products) => this.productSubject.next(products));
  }

  protected override mapAllItems(result: any): Product[] {
    return result.data?.allProducts || [];
  }

  protected override mapCreateItem(result: any): Product {
    console.log('created',result.data);
    return result.data?.addProduct as Product;
  }
  protected override mapSingleItem(result: any): Product {
    return result.data?.productByID as Product;
  }
  protected override mapUpdateItem(result: any): Product {
    console.log('updated',result.data);
    return result.data?.updateProduct as Product;
    
  }


  override getAll(): Observable<Product[]> {
    return super.getAll().pipe(
      map((products) => {
        console.log('products', products);
        this.productSubject.next(products);
        return products;
      })
    );
  }
  override get(id: number): Observable<Product> {
    return super.get(id).pipe(
      map((product) => {
        return product;
      })
    );
  }

  override create(item: Product): Observable<Product> {
    return super.create(item).pipe(
      map((newProduct) => {
        const products = [...this.productSubject.value, newProduct];
        this.productSubject.next(products);
        console.log('new product', newProduct);
        return newProduct;
        
      })
    );
  }

  override update(id: number, item: Product): Observable<Product> {
    return super.update(id, item).pipe(
      map((updatedProduct) => {
        const products = this.productSubject.value.map((p) =>
          p.id === id ? updatedProduct : p
        );
        this.productSubject.next(products);
        return updatedProduct;
      })
    );
  }
}
