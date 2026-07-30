import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ChargeService, ChargeExtended } from '../../services/charge.service';
import { CopropertyService } from '../../services/coproperty.service';
import { CurrencyService } from '../../services/currency.service';
import { Coproperty } from '../../models/coproperty.models';
import { KeycloakService } from '@myb-front/auth';
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
  private currencyService = inject(CurrencyService);
  private keycloakService = inject(KeycloakService);

  get currencySymbol(): string {
    const currency =
      this.selectedCoproperty()?.currency ??
      this.coproperties().find(c => c.id === this.budgetForm?.get('copropertyId')?.value)?.currency;
    return this.currencyService.getSymbol(currency);
  }

  budgetForm!: FormGroup;
  coproperties = signal<Coproperty[]>([]);
  selectedCoproperty = signal<Coproperty | null>(null);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  saveSuccess = signal<boolean>(false);
  budgetId: string | null = null;
  isEditMode = signal<boolean>(false);
  copropertyIdFromUrl: string | null = null;

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
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadCoproperties();
    this.checkEditMode();
    this.checkCopropertyFromUrl();
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
      distributionMethod: ['BY_SHARES'],
      startDate: ['', Validators.required],
      endDate: [''],
      isActive: [true],
      isContribution: [false]
    });
  }

  private loadCoproperties(): void {
    const managerId = this.keycloakService.getSyndicManagerId();
    this.copropertyService.getCoproperties(managerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.coproperties.set(data);
          // If we have a coproperty ID from URL, find and set it
          if (this.copropertyIdFromUrl) {
            const coproperty = data.find(c => c.id === this.copropertyIdFromUrl);
            if (coproperty) {
              this.selectedCoproperty.set(coproperty);
              this.budgetForm.patchValue({ copropertyId: coproperty.id });
            }
          } else if (data.length > 0 && !this.budgetForm.get('copropertyId')?.value) {
            // Auto-select first coproperty by default
            this.selectedCoproperty.set(data[0]);
            this.budgetForm.patchValue({ copropertyId: data[0].id });
          } else {
            const selected = data.find(c => c.id === this.budgetForm.get('copropertyId')?.value);
            if (selected) this.selectedCoproperty.set(selected);
          }
        },
        error: (err) => {
          console.error('Error loading coproperties:', err);
        }
      });
  }

  private checkCopropertyFromUrl(): void {
    this.activatedRoute.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const copropertyId = params.get('copropertyId');
        if (copropertyId) {
          this.copropertyIdFromUrl = copropertyId;
          this.loadCopropertyDetails(copropertyId);
        }
      });
  }

  private loadCopropertyDetails(id: string): void {
    this.copropertyService.getCoproperty(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (coproperty) => {
          this.selectedCoproperty.set(coproperty);
          this.budgetForm.patchValue({ copropertyId: coproperty.id });
        },
        error: (err) => {
          console.error('Error loading coproperty:', err);
        }
      });
  }

  onCopropertyChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const copropertyId = select.value;
    const coproperty = this.coproperties().find(c => c.id === copropertyId);
    this.selectedCoproperty.set(coproperty || null);
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
            isActive: budget.isActive,
            isContribution: budget.isContribution ?? false
          };

          if (budget.endDate) {
            const endDate = new Date(budget.endDate);
            formData.endDate = endDate.toISOString().split('T')[0];
          }
          
          this.budgetForm.patchValue(formData);
          const selected = this.coproperties().find(c => c.id === budget.copropertyId);
          if (selected) this.selectedCoproperty.set(selected);
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

    operation
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.saving.set(false);
          this.saveSuccess.set(true);

          this.router.navigate(['/coproperty/syndic/budgets'], {
            queryParams: {
              refresh: Date.now(),
              year: formValue.frequency
            }
          });
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
    if (this.copropertyIdFromUrl) {
      this.router.navigate(['/coproperty/syndic/budgets'], {
        queryParams: { copropertyId: this.copropertyIdFromUrl }
      });
    } else {
      this.router.navigate(['/coproperty/syndic/budgets']);
    }
  }

  calculateDistribution(): void {
    const copropertyId = this.budgetForm.get('copropertyId')?.value;
    const totalAmount = this.budgetForm.get('totalAmount')?.value;
    const distributionMethod = this.budgetForm.get('distributionMethod')?.value;

    if (!copropertyId || !totalAmount || !distributionMethod) {
      return;
    }

    // Navigate to distribution calculation page or show distribution modal
    // This would typically show a breakdown of how charges are distributed among units
    console.log('Calculate distribution:', {
      copropertyId,
      totalAmount,
      distributionMethod
    });
    
    // You can implement a modal or navigate to a distribution details page
    this.router.navigate(['/coproperty/syndic/distribution'], {
      queryParams: {
        copropertyId,
        totalAmount,
        distributionMethod
      }
    });
  }

  private convertToISODateTime(dateString: string | null): string | null {
    if (!dateString) return null;
    return `${dateString}T00:00:00`;
  }
}
