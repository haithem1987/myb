import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { Tax } from '../../../models/tax.model';
import { TaxService } from '../../../services/tax.service';
import { ProductType } from '../../../models/productType';
import { Product } from '../../../models/product.model';
import { ProductService } from '../../../services/product.service';
import { ToastService } from '../../../../../../shared/infra/services/toast.service';
import { Router, RouterLink } from '@angular/router';
import {
  NgbActiveModal,
  NgbDropdownModule,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { CreateTaxComponent } from '../../tax-component/create-tax/createTax.component';

@Component({
  selector: 'myb-front-create-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgbDropdownModule,CreateTaxComponent],
  templateUrl: './createProduct.component.html',
  styleUrl: './createProduct.component.css',
})
export class CreateProductComponent {
  private taxService = inject(TaxService);
  private productService = inject(ProductService);
  private toastService = inject(ToastService);
  private activeModal = inject(NgbActiveModal);
  private modalService = inject(NgbModal);

  errorMessage: string = '';
  tax!: Tax;
  taxes$: Observable<Tax[]> = this.taxService.taxes$;

  productType: ProductType = ProductType.Product;

  productForm: FormGroup = new FormGroup({
    productName: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required),
    unit: new FormControl('', Validators.required),
    price: new FormControl('', Validators.required),
  });

  setTypeToProduct(): void {
    this.productType = ProductType.Product;
    console.log(this.productType);
  }
  setTypeToService(): void {
    this.productType = ProductType.Service;
    console.log(this.productType);
  }
  setTax(tax: Tax): void {
    this.tax = tax;
  }

  save(): void {
    const product = new Product();
    if (this.productForm.valid && this.tax != null) {
      product.createdAt = new Date();
      product.updatedAt = new Date();
      product.name = this.productForm.value.productName;
      product.description = this.productForm.value.description;
      product.price = parseInt(this.productForm.value.price);
      product.taxId = this.tax.id;
      product.productType = this.productType;
      product.unit = this.productForm.value.unit;
      product.isArchived = false;

      this.productService.create(product).subscribe(() => {
        this.toastService.show('Product created successfully!', {
          classname: 'bg-success text-light',
        });
        this.closeModal();
      });
    } else {
      this.errorMessage = 'tax is required !';
      this.productForm.markAllAsTouched();
    }
  }
  closeModal(): void {
    this.activeModal.dismiss();
  }
  openModal(): void {
    this.modalService.open(CreateTaxComponent); 
  }
}
