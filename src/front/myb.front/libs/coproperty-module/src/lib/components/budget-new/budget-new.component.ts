import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ChargeService, ChargeExtended } from '../../services/charge.service';
import { CopropertyService } from '../../services/coproperty.service';
import { Coproperty } from '../../models/coproperty.models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'myb-budget-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './budget-new.component.html',
  styleUrls: ['./budget-new.component.scss'],
})
export class BudgetNewComponent implements OnInit {
  private chargeService = inject(ChargeService);
  private copropertyService = inject(CopropertyService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private translateService = inject(TranslateService);

  budgetForm!: FormGroup;
  coproperties = signal<Coproperty[]>([]);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  saveSuccess = signal<boolean>(false);
  budgetId: string | null = null;
  isEditMode = signal<boolean>(false);

  chargeTypes = [
    { value: 'CLEANING', label: 'coproperty.charges.types.cleaning', icon: 'bi-broom' },
    { value: 'SECURITY', label: 'coproperty.charges.types.security', icon: 'bi-shield-check' },
    { value: 'MAINTENANCE', label: 'coproperty.charges.types.maintenance', icon: 'bi-tools' },
    { value: 'ELECTRICITY', label: 'coproperty.charges.types.electricity', icon: 'bi-lightning' },
    { value: 'WATER', label: 'coproperty.charges.types.water', icon: 'bi-droplet' },
    { value: 'INSURANCE', label: 'coproperty.charges.types.insurance', icon: 'bi-shield' },
    { value: 'OTHER', label: 'coproperty.charges.types.other', icon: 'bi-three-dots' }
  ];

  years = this.generateYears();

  distributionMethods = [
    { value: 'BY_SHARES', label: 'coproperty.charges.distributions.byShares', icon: 'bi-percent' },
    { value: 'BY_AREA', label: 'coproperty.charges.distributions.byArea', icon: 'bi-rulers' },
    { value: 'EQUAL', label: 'coproperty.charges.distributions.equal', icon: 'bi-distribute-vertical' },
    { value: 'CUSTOM', label: 'coproperty.charges.distributions.custom', icon: 'bi-gear' }
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadCoproperties();
    this.checkEditMode();
  }

  private generateYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = currentYear; i <= currentYear + 6; i++) {
      years.push(i);
    }
    return years;
  }

  private initializeForm(): void {
    const currentYear = new Date().getFullYear();
    this.budgetForm = this.formBuilder.group({
      copropertyId: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      chargeType: ['CLEANING', Validators.required],
      frequency: [currentYear.toString(), Validators.required],
      totalAmount: ['', [Validators.required, Validators.min(0.01)]],
      distributionMethod: ['BY_SHARES', Validators.required],
      startDate: ['', Validators.required],
      endDate: [''],
      isActive: [true]
    });
  }

  private loadCoproperties(): void {
    this.copropertyService.getCoproperties()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.coproperties.set(data);
        },
        error: (err) => {
          console.error('Error loading coproperties:', err);
        }
      });
  }

  private checkEditMode(): void {
    this.activatedRoute.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id');
        if (id && id !== 'new') {
          this.budgetId = id;
          this.isEditMode.set(true);
          this.loadBudget(id);
        }
      });
  }

  private loadBudget(id: string): void {
    this.loading.set(true);
    this.chargeService.getChargeById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (budget) => {
          const startDate = new Date(budget.startDate);
          const isoStartDate = startDate.toISOString().split('T')[0];
          
          const formData: any = {
            copropertyId: budget.copropertyId,
            name: budget.name,
            description: budget.description,
            chargeType: budget.chargeType,
            frequency: budget.frequency,
            totalAmount: budget.totalAmount,
            distributionMethod: budget.distributionMethod,
            startDate: isoStartDate,
            isActive: budget.isActive
          };

          if (budget.endDate) {
            const endDate = new Date(budget.endDate);
            formData.endDate = endDate.toISOString().split('T')[0];
          }
          
          this.budgetForm.patchValue(formData);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading budget:', err);
          this.loading.set(false);
        }
      });
  }

  saveBudget(): void {
    if (this.budgetForm.invalid) {
      Object.keys(this.budgetForm.controls).forEach(key => {
        this.budgetForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.saving.set(true);
    const formValue = this.budgetForm.value;
    
    const budgetData: ChargeExtended = {
      ...formValue,
      startDate: this.convertToISODateTime(formValue.startDate),
      endDate: formValue.endDate ? this.convertToISODateTime(formValue.endDate) : null,
      id: this.budgetId || '00000000-0000-0000-0000-000000000000',
      createdBy: '00000000-0000-0000-0000-000000000000'
    };

    const operation = this.isEditMode() && this.budgetId
      ? this.chargeService.updateCharge(budgetData)
      : this.chargeService.createCharge(budgetData);

    operation.subscribe({
      next: (result) => {
        this.saving.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
        
        if (!this.isEditMode()) {
          this.budgetId = result.id || null;
          this.isEditMode.set(true);
          this.router.navigate(['/coproperty/syndic/budgets', result.id, 'edit'], { replaceUrl: true });
        }
      },
      error: (error) => {
        console.error('Error saving budget:', error);
        this.saving.set(false);
      }
    });
  }

  deleteBudget(): void {
    if (!this.budgetId) return;
    
    this.translateService.get('coproperty.charges.deleteConfirm').subscribe((message) => {
      if (confirm(message)) {
        this.chargeService.deleteCharge(this.budgetId!).subscribe({
          next: () => {
            this.router.navigate(['/coproperty/syndic/budgets']);
          },
          error: (error) => {
            console.error('Error deleting budget:', error);
          }
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/coproperty/syndic/budgets']);
  }

  private convertToISODateTime(dateString: string | null): string | null {
    if (!dateString) return null;
    return `${dateString}T00:00:00`;
  }
}
