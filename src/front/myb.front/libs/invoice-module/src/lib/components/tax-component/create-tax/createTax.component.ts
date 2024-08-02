import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Tax } from '../../../models/tax.model';
import { TaxService } from '../../../services/tax.service';
import { ToastService } from '../../../../../../shared/infra/services/toast.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'myb-front-create-tax',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './createTax.component.html',
  styleUrl: './createTax.component.css',
})
export class CreateTaxComponent {
  isPercentage: boolean = true;

  private taxService = inject(TaxService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  taxForm: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
    value: new FormControl('', Validators.required),
  });

  setIsPercentageTrue(): void {
    this.isPercentage = true;
    console.log(this.isPercentage);
  }

  setIsPercentageFalse(): void {
    this.isPercentage = false;
    console.log(this.isPercentage);
  }

  save(): void {
    const tax = new Tax();
    if (this.taxForm.valid) {
      tax.name = this.taxForm.value.name;
      tax.value = parseInt(this.taxForm.value.value);
      tax.isPercentage = this.isPercentage;
      tax.createdAt = new Date();
      tax.updatedAt = new Date();
      this.taxService.create(tax).subscribe(() => {
        this.toastService.show('Tax created successfully!', {
          classname: 'bg-success text-light',
        });
        this.router.navigate(['/invoice/taxes']);
      });
    } else {
      this.taxForm.markAllAsTouched();
    }
  }
}
