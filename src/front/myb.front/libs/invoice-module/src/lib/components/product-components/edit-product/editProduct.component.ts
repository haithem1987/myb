import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal, NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Product } from '../../../models/product.model';
import { ProductService } from '../../../services/product.service';
import { ToastService } from 'libs/shared/infra/services/toast.service';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ProductType } from '../../../models/productType';
import { Tax } from '../../../models/tax.model';
import { CreateTaxComponent } from '../../tax-component/create-tax/createTax.component';
import { TaxService } from '../../../services/tax.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'myb-front-edit-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CreateTaxComponent,NgbDropdownModule],
  templateUrl: './editProduct.component.html',
  styleUrl: './editProduct.component.css',
})
export class EditProductComponent implements OnInit {
  @Input() product!: Product;

  private activeModal = inject(NgbActiveModal);
  private productService = inject(ProductService);
  private toastService = inject(ToastService);
  private modalService = inject(NgbModal);
  private taxService = inject(TaxService);
  taxes$: Observable<Tax[]> = this.taxService.taxes$;
  productType: ProductType = ProductType.Product;
  tax!: Tax;

  productForm!: FormGroup;
  errorMessage: string = '';

  ngOnInit(): void {
    this.initializeForm();
    this.productType = this.product.productType;
    this.tax = this.product.tax;
    console.log('productToUpdate', this.product);
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }
  private initializeForm(): void {
    this.productForm = new FormGroup({
      productName: new FormControl(this.product.name, Validators.required),
      description: new FormControl(
        this.product.description,
        Validators.required
      ),
      unit: new FormControl(this.product.unit, Validators.required),
      price: new FormControl(this.product.price, Validators.required),
    });
  }

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
  openModal(): void {
    this.modalService.open(CreateTaxComponent);
  }

  save() {
    if (this.productForm.valid && this.tax != null) {
      const updatedProduct = {
        ...this.product,
        name: this.productForm.value.productName,
        description: this.productForm.value.description,
        unit: this.productForm.value.unit,
        updatedAt: new Date(),
        price: parseInt(this.productForm.value.price),
        tax: this.tax,
        taxId: this.tax.id,
        productType: this.productType,
      }
      this.productService.update(this.product.id, updatedProduct).subscribe(() => {
        this.toastService.show('Product updated successfully!', {
          classname: 'bg-success text-light',
        });
        this.closeModal();
      });
    }
    else {
      this.errorMessage = 'tax is required !';
      this.productForm.markAllAsTouched();
    }
  }

  isService(){
    if(this.productType == ProductType.Service){
      return true;
    }
    else{
      return false;
    }
  }
}
