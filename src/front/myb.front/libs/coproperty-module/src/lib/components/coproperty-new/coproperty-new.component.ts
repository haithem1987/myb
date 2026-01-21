import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CopropertyService } from '../../services/coproperty.service';
import { CreateCopropertyInput, Coproperty } from '../../models/coproperty.model';
import { UnitManagementComponent } from '../unit-management/unit-management.component';
import { ChargeManagementComponent } from '../charge-management/charge-management.component';
import { MaintenanceRequestsComponent } from '../maintenance-requests/maintenance-requests.component';

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
    MaintenanceRequestsComponent
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
  private currentIsActive = true;

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
      managerId: ['', [Validators.required]]
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
          managerId: coproperty.managerId
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
    
    // Ensure managerId is a valid UUID, use test UUID as fallback
    let managerId = formData.managerId?.trim() || '';
    if (!managerId || !this.isValidUUID(managerId)) {
      // Use a well-known test manager UUID
      managerId = '11111111-1111-1111-1111-111111111111';
      console.warn('Invalid or missing managerId, using test UUID:', managerId);
    }
    
    const id = this.isEditMode() && this.copropertyId() ? this.copropertyId()! : this.generateUUID();

    const payload: CreateCopropertyInput = {
      id,
      name: formData.name,
      address: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
      country: formData.country ?? 'France',
      description: formData.description,
      totalUnits: formData.totalUnits,
      totalShares: formData.totalShares,
      commonAreas: formData.commonAreas,
      managerId: managerId,
      isActive: this.currentIsActive,
      units: [],
      charges: [],
      maintenanceRequests: []
    };

    const save$ = this.isEditMode() && this.copropertyId()
      ? this.copropertyService.updateCoproperty(this.copropertyId()!, payload)
      : this.copropertyService.createCoproperty(payload);

    save$.subscribe({
      next: (coproperty) => {
        this.saving.set(false);
        const id = coproperty.id;
        this.copropertyId.set(id);
        this.router.navigate(['/coproperty', id, 'edit']);
      },
      error: (error) => {
        this.saving.set(false);
        console.error('Failed to save coproperty', error);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/coproperty']);
  }

  get formTitle(): string {
    return this.isEditMode() ? 'coproperty.form.editCoproperty' : 'coproperty.form.newCoproperty';
  }
}
