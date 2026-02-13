import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CopropertyService } from '../../services/coproperty.service';
import { CreateCopropertyInput, Coproperty, Currency } from '../../models/coproperty.model';
import { UnitManagementComponent } from '../unit-management/unit-management.component';
import { ChargeManagementComponent } from '../charge-management/charge-management.component';
import { MaintenanceRequestsComponent } from '../maintenance-requests/maintenance-requests.component';
import { ManagerMultiSelectComponent } from '../manager-multi-select/manager-multi-select.component';

@Component({
  selector: 'myb-coproperty-new',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    UnitManagementComponent,
    ChargeManagementComponent,
    MaintenanceRequestsComponent,
    ManagerMultiSelectComponent
  ],
  templateUrl: './coproperty-new.component.html',
  styleUrls: ['./coproperty-new.component.scss'],
})
export class CopropertyNewComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private copropertyService = inject(CopropertyService);

  activeTab = signal<string>('info');
  copropertyForm!: FormGroup;
  isEditMode = signal<boolean>(false);
  copropertyId = signal<string | null>(null);
  saving = signal<boolean>(false);
  saveSuccess = signal<boolean>(false);
  private currentIsActive = true;
  
  // Available currencies
  currencies = [
    { value: Currency.USD, label: 'US Dollar (USD)', icon: 'bi-currency-dollar' },
    { value: Currency.EUR, label: 'Euro (EUR)', icon: 'bi-currency-euro' },
    { value: Currency.TND, label: 'Tunisian Dinar (TND)', icon: 'bi-cash' },
    { value: Currency.GBP, label: 'British Pound (GBP)', icon: 'bi-currency-pound' },
    { value: Currency.CHF, label: 'Swiss Franc (CHF)', icon: 'bi-cash' },
    { value: Currency.CAD, label: 'Canadian Dollar (CAD)', icon: 'bi-currency-dollar' },
    { value: Currency.AED, label: 'UAE Dirham (AED)', icon: 'bi-cash' },
    { value: Currency.MAD, label: 'Moroccan Dirham (MAD)', icon: 'bi-cash' }
  ];

  private isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    
    // Check if we're in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.copropertyId.set(id);
      this.loadCoproperty(id);
    }
  }

  initializeForm(): void {
    this.copropertyForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      country: ['France', [Validators.required]],
      description: [''],
      totalUnits: [0, [Validators.required, Validators.min(1)]],
      totalShares: [0, [Validators.required, Validators.min(1)]],
      commonAreas: [''],
      currency: [Currency.EUR, [Validators.required]],
      managerName: ['']
    });
  }

  loadCoproperty(id: string): void {
    this.copropertyService.getCoproperty(id).subscribe({
      next: (coproperty: Coproperty) => {
        this.copropertyForm.patchValue({
          name: coproperty.name,
          address: coproperty.address,
          city: coproperty.city,
          postalCode: coproperty.postalCode,
          country: coproperty.country,
          description: coproperty.description,
          totalUnits: coproperty.totalUnits,
          totalShares: coproperty.totalShares,
          commonAreas: coproperty.commonAreas,
          currency: coproperty.currency || Currency.EUR,
          managerName: coproperty.managerName || ''
        });
        this.currentIsActive = coproperty.isActive;
      },
      error: (error) => {
        console.error('Failed to load coproperty', error);
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
  }

  saveCoproperty(): void {
    if (this.copropertyForm.invalid) {
      Object.keys(this.copropertyForm.controls).forEach(key => {
        this.copropertyForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.saving.set(true);

    const formData = this.copropertyForm.value as Omit<CreateCopropertyInput, 'id'>;
    const id = this.isEditMode() && this.copropertyId() ? this.copropertyId()! : this.generateUUID();

    const payload: CreateCopropertyInput = {
      id,
      name: formData.name,
      address: formData.address,
      city: formData.city,
      currency: formData.currency ?? Currency.EUR,
      postalCode: formData.postalCode,
      country: formData.country ?? 'France',
      description: formData.description,
      totalUnits: formData.totalUnits,
      totalShares: formData.totalShares,
      commonAreas: formData.commonAreas,
      managerName: formData.managerName?.trim() || undefined,
      isActive: this.currentIsActive
    };

    const save$ = this.isEditMode() && this.copropertyId()
      ? this.copropertyService.updateCoproperty(this.copropertyId()!, payload)
      : this.copropertyService.createCoproperty(payload);

    save$.subscribe({
      next: (coproperty) => {
        this.saving.set(false);
        this.saveSuccess.set(true);
        
        // Hide success message after 3 seconds
        setTimeout(() => this.saveSuccess.set(false), 3000);
        
        const id = coproperty.id;
        this.copropertyId.set(id);
        
        const wasInEditMode = this.isEditMode();
        this.isEditMode.set(true);
        
        if (wasInEditMode) {
          // Already in edit mode - just reload the coproperty data
          this.loadCoproperty(id);
        } else {
          // Was creating new - navigate to edit mode so tabs become available
          this.router.navigate(['/coproperty/syndic/coproperties', id, 'edit']);
        }
      },
      error: (error) => {
        this.saving.set(false);
        this.saveSuccess.set(false);
        console.error('Failed to save coproperty', error);
      }
    });
  }

  onManagerSelected(selection: { name?: string }): void {
    if (selection.name !== undefined) {
      this.copropertyForm.get('managerName')?.setValue(selection.name);
    }
  }

  cancel(): void {
    this.router.navigate(['/coproperty/syndic/coproperties']);
  }

  get formTitle(): string {
    return this.isEditMode() ? 'coproperty.form.editCoproperty' : 'coproperty.form.newCoproperty';
  }
}
