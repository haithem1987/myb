import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductService } from 'libs/invoice-module/src/lib/services/product.service';
import { Observable } from 'rxjs';
import { Product } from 'libs/invoice-module/src/lib/models/product.model';
import { CreateProductComponent } from '../../../product-components/create-product/createProduct.component';

@Component({
  selector: 'myb-front-select-product',
  standalone: true,
  imports: [CommonModule, CreateProductComponent],
  templateUrl: './selectProduct.component.html',
  styleUrl: './selectProduct.component.css',
})
export class SelectProductComponent {
  @Output() productEntered = new EventEmitter<Product>();
  
  activeModal = inject(NgbActiveModal);
  modalService = inject(NgbModal);

  productService = inject(ProductService);

  products$: Observable<Product[]> = this.productService.products$;

  

  closeModal(): void {
    this.activeModal.dismiss();
  }

  openCreateProductModal() {
    this.modalService.open(CreateProductComponent, { size: 'lg' });
  }

  selectProduct(product: Product): void {
    this.productEntered.emit(product);
    this.closeModal();   
}
}
