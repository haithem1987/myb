import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SelectProductComponent } from '../select-product/selectProduct.component';
import { Product } from 'libs/invoice-module/src/lib/models/product.model';
import { TaxService } from 'libs/invoice-module/src/lib/services/tax.service';
import { Tax } from 'libs/invoice-module/src/lib/models/tax.model';
import { InvoiceDetails } from 'libs/invoice-module/src/lib/models/invoiceDetails.model';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'myb-front-add-item-to-invoice',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,SelectProductComponent],
  templateUrl: './addItemToInvoice.component.html',
  styleUrl: './addItemToInvoice.component.css',
})
export class AddItemToInvoiceComponent {
  @Output() itemAdded = new EventEmitter<Tax>();
  activeModal = inject(NgbActiveModal);
  modalService = inject(NgbModal);
  taxService = inject(TaxService);

  product?: Product;
  productInvalid: String = '';

  tax?: Tax;

  invoiceDetailsForm: FormGroup = new FormGroup({
    quantity: new FormControl('',Validators.required),
    salePrice: new FormControl(''),
  });

  save(){  
    const invoiceDetails = new InvoiceDetails();
    if(this.invoiceDetailsForm.valid && this.product != null && this.tax != null){
      invoiceDetails.productId = this.product.id;
      invoiceDetails.quantity = this.invoiceDetailsForm.value.quantity;
      if(this.invoiceDetailsForm.value.salePrice){
        invoiceDetails.unitPrice = this.invoiceDetailsForm.value.salePrice;
      } 
      else{
        invoiceDetails.unitPrice = this.calculatePriceWithTax(this.product.price, this.tax)
      }

      invoiceDetails.totalPrice = invoiceDetails.unitPrice! * invoiceDetails.quantity!
      invoiceDetails.createdAt = new Date();
      invoiceDetails.updatedAt == new Date();

      this.addItem(invoiceDetails);
      this.closeModal()

    }
    else{
      this.productInvalid = 'Product is required !';
      this.invoiceDetailsForm.markAllAsTouched();
    }
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }

  openSelectProductModal() {
    const modalRef = this.modalService.open(SelectProductComponent, {
      size: 'lg',
    });
    modalRef.componentInstance.productEntered.subscribe((product: Product) => {
      if (product) {
        this.product = product;
        this.getTax(this.product?.taxId!);
      }
    });
  }

  addItem(item: InvoiceDetails){
    this.itemAdded.emit(item);
  }

  
  getTax(id: number){
    this.taxService.get(id).subscribe((tax)=>{
      this.tax = tax;
    })
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
