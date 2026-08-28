import { Component, OnInit, inject, signal, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { ChargeService, ChargeExtended, ChargeDistributionExtended } from '../../services/charge.service';
import { CurrencyService } from '../../services/currency.service';
import { BudgetNewComponent } from '../budget-new/budget-new.component';

@Component({
  selector: 'myb-charge-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, BudgetNewComponent],
  templateUrl: './charge-management.component.html',
  styleUrls: ['./charge-management.component.scss'],
})
export class ChargeManagementComponent implements OnInit, OnChanges {
  @Input() copropertyId: string | null = null;
  
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private chargeService = inject(ChargeService);
  private translateService = inject(TranslateService);
  private currencyService = inject(CurrencyService);

  charges = signal<ChargeExtended[]>([]);
  distributions = signal<ChargeDistributionExtended[]>([]);
  showForm = signal<boolean>(false);
  showDistribution = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  currentChargeId = signal<string | null>(null);
  resolvedCopropertyId = signal<string | null>(null);
  loading = signal<boolean>(false);
  selectedDistributionMethod = signal<string>('BY_SHARES');
  alert = signal<{type: 'success' | 'danger' | 'warning' | null, message: string}>({type: null, message: ''});

  chargeForm: FormGroup;
  years: number[] = [];

  constructor() {
    this.years = this.generateYears();
    const currentYear = new Date().getFullYear().toString();
    
    this.chargeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      chargeType: ['CLEANING', Validators.required],
      frequency: [currentYear, Validators.required],
      totalAmount: ['', [Validators.required, Validators.min(0.01)]],
      distributionMethod: ['BY_SHARES', Validators.required],
      startDate: ['', Validators.required],
      endDate: [''],
      isActive: [true],
      isContribution: [false]
    });
  }

  private generateYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = currentYear; i <= currentYear + 6; i++) {
      years.push(i);
    }
    return years;
  }

  ngOnInit() {
    if (this.copropertyId) {
      this.resolvedCopropertyId.set(this.copropertyId);
      this.loadCharges();
    } else {
      this.route.parent?.params.subscribe(params => {
        const idFromRoute = params['id'];
        if (idFromRoute) {
          this.resolvedCopropertyId.set(idFromRoute);
          this.loadCharges();
        }
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['copropertyId'] && !changes['copropertyId'].firstChange) {
      this.resolvedCopropertyId.set(this.copropertyId);
      if (this.copropertyId) {
        this.loadCharges();
      }
    }
  }

  loadCharges() {
    const idStr = this.resolvedCopropertyId();
    if (!idStr) {
      this.charges.set([]);
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.chargeService.getChargesByCoproperty(idStr).subscribe({
      next: (data: ChargeExtended[]) => {
        this.charges.set(data);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading charges:', error);
        this.loading.set(false);
      }
    });
  }

  showAddForm() {
    this.isEditing.set(false);
    this.showForm.set(true);
    this.currentChargeId.set(null);
    const currentYear = new Date().getFullYear().toString();
    this.chargeForm.reset({
      chargeType: 'CLEANING',
      frequency: currentYear,
      distributionMethod: 'BY_SHARES',
      isActive: true,
      isContribution: false,
      totalAmount: ''
    });
  }

  editCharge(charge: ChargeExtended) {
    this.isEditing.set(true);
    this.currentChargeId.set(charge.id || null);
    this.showForm.set(true);
    this.chargeForm.patchValue({
      ...charge,
      startDate: this.toDateInput(charge.startDate),
      endDate: charge.endDate ? this.toDateInput(charge.endDate) : '',
      isContribution: charge.isContribution ?? false
    });
  }

  saveCharge() {
    if (this.chargeForm.valid) {
      this.loading.set(true);
      const copropertyIdStr = this.resolvedCopropertyId();
      
      const formValue = this.chargeForm.value;
      const chargeData: ChargeExtended = {
        ...formValue,
        startDate: this.convertToISODateTime(formValue.startDate),
        endDate: formValue.endDate ? this.convertToISODateTime(formValue.endDate) : null,
        copropertyId: copropertyIdStr,
        id: this.currentChargeId() || '00000000-0000-0000-0000-000000000000',
        createdBy: '00000000-0000-0000-0000-000000000000'
      };

      const operation = this.isEditing() && this.currentChargeId()
        ? this.chargeService.updateCharge(chargeData)
        : this.chargeService.createCharge(chargeData);

      operation.subscribe({
        next: (savedCharge) => {
          this.charges.update(charges => {
            const existingIndex = charges.findIndex(charge => charge.id === savedCharge.id);
            if (existingIndex === -1) {
              return [savedCharge, ...charges];
            }

            return charges.map(charge => charge.id === savedCharge.id ? savedCharge : charge);
          });
          const messageKey = this.isEditing() ? 'coproperty.charge.budgetUpdated' : 'coproperty.charge.budgetCreated';
          this.translateService.get(messageKey).subscribe((message) => {
            this.showAlert('success', message);
          });
          this.cancelEdit();
          this.loading.set(false);
        },
        error: (error: any) => {
          console.error('Error saving charge:', error);
          this.translateService.get('coproperty.messages.saveFailed').subscribe((message) => {
            this.showAlert('danger', message);
          });
          this.loading.set(false);
        }
      });
    }
  }

  deleteCharge(chargeId: string) {
    this.translateService.get('coproperty.charges.deleteConfirm').subscribe((confirmMessage) => {
      if (confirm(confirmMessage)) {
        this.loading.set(true);
        this.chargeService.deleteCharge(chargeId).subscribe({
          next: () => {
            this.translateService.get('coproperty.messages.deleted').subscribe((message) => {
              this.showAlert('success', message);
            });
            this.loadCharges();
          },
          error: (error: any) => {
            console.error('Error deleting charge:', error);
            this.translateService.get('coproperty.messages.error').subscribe((message) => {
              this.showAlert('danger', message);
            });
            this.loading.set(false);
          }
        });
      }
    });
  }

  distributeCharge(chargeId: string) {
    // Find the charge to get its distribution method
    const charge = this.charges().find(c => c.id === chargeId);
    if (charge) {
      this.selectedDistributionMethod.set(charge.distributionMethod);
    }
    
    this.loading.set(true);
    this.chargeService.calculateDistribution(chargeId).subscribe({
      next: (data: ChargeDistributionExtended[]) => {
        this.distributions.set(data);
        this.showDistribution.set(true);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error distributing charge:', error);
        this.loading.set(false);
      }
    });
  }

  cancelEdit() {
    this.showForm.set(false);
    this.isEditing.set(false);
    this.currentChargeId.set(null);
    this.chargeForm.reset();
  }

  onBudgetSaved(savedCharge: ChargeExtended): void {
    this.charges.update(charges => {
      const exists = charges.some(charge => charge.id === savedCharge.id);
      return exists
        ? charges.map(charge => charge.id === savedCharge.id ? savedCharge : charge)
        : [savedCharge, ...charges];
    });
    const messageKey = this.isEditing() ? 'coproperty.charge.budgetUpdated' : 'coproperty.charge.budgetCreated';
    this.showAlert('success', this.translateService.instant(messageKey));
    this.cancelEdit();
  }

  onBudgetDeleted(chargeId: string): void {
    this.charges.update(charges => charges.filter(charge => charge.id !== chargeId));
    this.showAlert('success', this.translateService.instant('coproperty.messages.deleted'));
    this.cancelEdit();
  }

  closeDistribution() {
    this.showDistribution.set(false);
    this.distributions.set([]);
  }

  // Helper methods for template rendering
  getChargeTypeBadgeClass(chargeType: string): string {
    const classMap: { [key: string]: string } = {
      'CLEANING': 'bg-cleaning',
      'SECURITY': 'bg-security',
      'MAINTENANCE': 'bg-maintenance',
      'ELECTRICITY': 'bg-electricity',
      'WATER': 'bg-water',
      'INSURANCE': 'bg-insurance',
      'OTHER': 'bg-other'
    };
    return classMap[chargeType] || 'bg-secondary';
  }

  getChargeTypeKey(chargeType: string): string {
    return chargeType.toLowerCase();
  }

  getFrequencyKey(frequency: string): string {
    const map: { [key: string]: string } = {
      'MONTHLY': 'monthly',
      'QUARTERLY': 'quarterly',
      'ANNUAL': 'annual',
      'EXCEPTIONAL': 'exceptional'
    };
    return map[frequency] || 'monthly';
  }

  getDistributionKey(method: string): string {
    const map: { [key: string]: string } = {
      'BY_SHARES': 'byShares',
      'BY_AREA': 'byArea',
      'EQUAL': 'equal',
      'CUSTOM': 'custom'
    };
    return map[method] || 'byShares';
  }

  getTotalDistributedAmount(): number {
    return this.distributions().reduce((sum, dist) => sum + dist.amount, 0);
  }

  confirmAndSaveDistribution(): void {
    // This method can be extended to save the distribution if needed
    // For now, just close the modal and show a success message
    console.log(`Distribution confirmed for method: ${this.selectedDistributionMethod()}`);
    console.log(`Total distributed: ${this.getTotalDistributedAmount().toFixed(2)} ${this.currencyService.symbol}`);
    
    // Optionally, you can add a success toast notification here
    this.closeDistribution();
  }

  get currencySymbol(): string {
    return this.currencyService.symbol;
  }

  formatAmount(amount: number | string | undefined | null): string {
    return this.currencyService.formatAmount(amount);
  }

  private convertToISODateTime(dateString: string | null): string | null {
    if (!dateString) return null;
    // Convert YYYY-MM-DD to ISO DateTime (YYYY-MM-DDTHH:mm:ss)
    return `${dateString}T00:00:00`;
  }

  private toDateInput(value: Date | string): string {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    // GraphQL returns an ISO timestamp, while an HTML date input only accepts
    // YYYY-MM-DD. Slicing also avoids shifting the date through the local zone.
    return value.slice(0, 10);
  }

  private showAlert(type: 'success' | 'danger' | 'warning', message: string) {
    this.alert.set({type, message});
    setTimeout(() => this.alert.set({type: null, message: ''}), 5000);
  }
}
