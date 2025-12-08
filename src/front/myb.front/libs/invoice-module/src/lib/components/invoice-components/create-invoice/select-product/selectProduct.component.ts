import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductService } from 'libs/invoice-module/src/lib/services/product.service';
import { Observable } from 'rxjs';
import { Product } from 'libs/invoice-module/src/lib/models/product.model';
import { CreateProductComponent } from '../../../product-components/create-product/createProduct.component';
import { FormsModule } from '@angular/forms';
import { Tax } from 'libs/invoice-module/src/lib/models/tax.model';

@Component({
  selector: 'myb-front-select-product',
  standalone: true,
  imports: [CommonModule, CreateProductComponent, FormsModule],
  templateUrl: './selectProduct.component.html',
  styleUrl: './selectProduct.component.css',
})
export class SelectProductComponent {
  @Output() productEntered = new EventEmitter<Product>();
  
  activeModal = inject(NgbActiveModal);
  modalService = inject(NgbModal);

  productService = inject(ProductService);

  products$: Observable<Product[]> = this.productService.products$;
  searchTerm: string = '';

  

  closeModal(): void {
    this.activeModal.dismiss();
  }

  openCreateProductModal() {
    this.modalService.open(CreateProductComponent, {fullscreen: true , scrollable: true});
  }

  selectProduct(product: Product): void {
    this.productEntered.emit(product);
    this.closeModal();   
}

calculatePriceWithTax(price: number, tax: Tax) : number{
  if(tax.isPercentage){
    var taxValue = (price/100) * tax.value!
    return price + taxValue;
  }
  else{
    return price + tax.value!
  }
}
}
