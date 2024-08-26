import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tax } from '../../../models/tax.model';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaxService } from '../../../services/tax.service';
import { ToastService } from 'libs/shared/infra/services/toast.service';

@Component({
  selector: 'myb-front-edit-tax',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editTax.component.html',
  styleUrl: './editTax.component.css',
})
export class EditTaxComponent implements OnInit{
  
  @Input() tax!: Tax;
  private activeModal = inject(NgbActiveModal);
  private taxService = inject(TaxService);
  private toastService = inject(ToastService);

  taxForm!: FormGroup;
  isPercentage: boolean = true;


  ngOnInit(): void {
    this.initializeForm();
    this.isPercentage = this.tax.isPercentage!;
  }

  save(){
    if (this.taxForm.valid) {
      const updatedTax = {
        ...this.tax,
        name: this.taxForm.value.name,
        value: parseInt(this.taxForm.value.value),
        updatedAt: new Date(),
        isPercentage: this.isPercentage
      };
      this.taxService.update(this.tax.id, updatedTax ).subscribe(() => {
        this.toastService.show('Tax updated successfully!', {
          classname: 'bg-success text-light',
        });
        this.closeModal()
      });
    } else {
      this.taxForm.markAllAsTouched();
    }
  }

  private initializeForm(): void {
    this.taxForm = new FormGroup({
      name: new FormControl(this.tax.name, Validators.required),
    value: new FormControl(this.tax.value, Validators.required),
    });
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }
  setIsPercentageTrue(): void {
    this.isPercentage = true;
    console.log(this.isPercentage);
  }

  setIsPercentageFalse(): void {
    this.isPercentage = false;
    console.log(this.isPercentage);
  }
}
