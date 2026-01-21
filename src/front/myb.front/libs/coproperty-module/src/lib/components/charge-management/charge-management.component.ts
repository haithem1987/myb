import { Component, OnInit, inject, signal } from '@angular/core';
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
export class ChargeManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private chargeService = inject(ChargeService);

  charges = signal<ChargeExtended[]>([]);
  distributions = signal<ChargeDistributionExtended[]>([]);
  showForm = signal<boolean>(false);
  showDistribution = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  currentChargeId = signal<number | null>(null);
  copropertyId = signal<number>(0);
  loading = signal<boolean>(false);

  chargeForm: FormGroup;

  constructor() {
    this.chargeForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      chargeType: ['CLEANING', Validators.required],
      frequency: ['MONTHLY', Validators.required],
      totalAmount: [0, [Validators.required, Validators.min(0)]],
      distributionMethod: ['BY_SHARES', Validators.required],
      startDate: ['', Validators.required],
      endDate: [''],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.route.parent?.params.subscribe(params => {
      this.copropertyId.set(+params['id'] || 0);
      if (this.copropertyId() > 0) {
        this.loadCharges();
      }
    });
  }

  loadCharges() {
    if (!this.copropertyId() || this.copropertyId() === 0) {
      this.charges.set([]);
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.chargeService.getChargesByCoproperty(this.copropertyId()).subscribe({
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
      totalAmount: 0
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
      const chargeData: ChargeExtended = {
        ...this.chargeForm.value,
        copropertyId: this.copropertyId(),
        ...(this.currentChargeId() && { id: this.currentChargeId()! })
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

  deleteCharge(chargeId: number) {
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

  distributeCharge(chargeId: number) {
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
}
