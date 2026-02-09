import { Component, OnInit, inject, signal, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { ChargeService, ChargeExtended, ChargeDistributionExtended } from '../../services/charge.service';

@Component({
  selector: 'myb-charge-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './charge-management.component.html',
  styleUrls: ['./charge-management.component.scss'],
})
export class ChargeManagementComponent implements OnInit, OnChanges {
  @Input() copropertyId: string | null = null;
  
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private chargeService = inject(ChargeService);

  charges = signal<ChargeExtended[]>([]);
  distributions = signal<ChargeDistributionExtended[]>([]);
  showForm = signal<boolean>(false);
  showDistribution = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  currentChargeId = signal<string | null>(null);
  resolvedCopropertyId = signal<string | null>(null);
  loading = signal<boolean>(false);
  selectedDistributionMethod = signal<string>('BY_SHARES');

  chargeForm: FormGroup;

  constructor() {
    this.chargeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      chargeType: ['CLEANING', Validators.required],
      frequency: ['MONTHLY', Validators.required],
      totalAmount: ['', [Validators.required, Validators.min(0.01)]],
      distributionMethod: ['BY_SHARES', Validators.required],
      startDate: ['', Validators.required],
      endDate: [''],
      isActive: [true]
    });
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
    this.chargeForm.reset({
      chargeType: 'CLEANING',
      frequency: 'MONTHLY',
      distributionMethod: 'BY_SHARES',
      isActive: true,
      totalAmount: ''
    });
  }

  editCharge(charge: ChargeExtended) {
    this.isEditing.set(true);
    this.currentChargeId.set(charge.id || null);
    this.showForm.set(true);
    this.chargeForm.patchValue(charge);
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
        next: () => {
          this.loadCharges();
          this.cancelEdit();
        },
        error: (error: any) => {
          console.error('Error saving charge:', error);
          this.loading.set(false);
        }
      });
    }
  }

  deleteCharge(chargeId: string) {
    if (confirm('Are you sure you want to delete this charge?')) {
      this.loading.set(true);
      this.chargeService.deleteCharge(chargeId).subscribe({
        next: () => this.loadCharges(),
        error: (error: any) => {
          console.error('Error deleting charge:', error);
          this.loading.set(false);
        }
      });
    }
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
    console.log(`Total distributed: ${this.getTotalDistributedAmount().toFixed(2)} €`);
    
    // Optionally, you can add a success toast notification here
    this.closeDistribution();
  }

  private convertToISODateTime(dateString: string | null): string | null {
    if (!dateString) return null;
    // Convert YYYY-MM-DD to ISO DateTime (YYYY-MM-DDTHH:mm:ss)
    return `${dateString}T00:00:00`;
  }
}
