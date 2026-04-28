import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { InterventionService } from '../../services/intervention.service';
import { CopropertyService } from '../../services/coproperty.service';
import { CurrencyService } from '../../services/currency.service';
import { Coproperty } from '../../models/coproperty.models';
import { Intervention, CreateInterventionInput, UpdateInterventionInput } from '../../models/intervention.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'myb-intervention-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './intervention-new.component.html',
  styleUrls: ['./intervention-new.component.scss'],
})
export class InterventionNewComponent implements OnInit {
  private interventionService = inject(InterventionService);
  private copropertyService = inject(CopropertyService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private translateService = inject(TranslateService);
  private currencyService = inject(CurrencyService);

  get currencySymbol(): string {
    return this.currencyService.symbol;
  }

  interventionForm!: FormGroup;
  coproperties = signal<Coproperty[]>([]);
  selectedCoproperty = signal<Coproperty | null>(null);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  saveSuccess = signal<boolean>(false);
  saveFailed = signal<boolean>(false);
  interventionId: string | null = null;
  isEditMode = signal<boolean>(false);
  copropertyIdFromUrl: string | null = null;
  existingIntervention = signal<Intervention | null>(null);

  interventionTypes = [
    { value: 'Plumbing', label: 'Plomberie' },
    { value: 'Electricity', label: 'Électricité' },
    { value: 'Elevator', label: 'Ascenseur' },
    { value: 'Cleaning', label: 'Nettoyage' },
    { value: 'Painting', label: 'Peinture' },
    { value: 'Locksmith', label: 'Serrurerie' },
    { value: 'GardenMaintenance', label: 'Jardinage' },
    { value: 'PestControl', label: 'Dératisation' },
    { value: 'FireSafety', label: 'Sécurité incendie' },
    { value: 'RoofRepair', label: 'Toiture' },
    { value: 'CommonAreaRepair', label: 'Parties communes' },
    { value: 'HeatingCooling', label: 'Chauffage/Clim' },
    { value: 'SecuritySystem', label: 'Sécurité' },
    { value: 'WasteManagement', label: 'Gestion déchets' },
    { value: 'Other', label: 'Autre' }
  ];

  priorities = [
    { value: 'Low', label: 'Basse' },
    { value: 'Normal', label: 'Normale' },
    { value: 'High', label: 'Haute' },
    { value: 'Emergency', label: 'Urgence' }
  ];

  statuses = [
    { value: 'Draft', label: 'Brouillon' },
    { value: 'Planned', label: 'Planifié' },
    { value: 'InProgress', label: 'En cours' },
    { value: 'Completed', label: 'Terminé' },
    { value: 'Cancelled', label: 'Annulé' },
    { value: 'Invoiced', label: 'Facturé' }
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadCoproperties();
    this.checkEditMode();
    this.checkCopropertyFromUrl();
  }

  private initializeForm(): void {
    this.interventionForm = this.formBuilder.group({
      copropertyId: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      interventionType: ['Other', Validators.required],
      priority: ['Normal', Validators.required],
      status: ['Draft', Validators.required],
      providerName: [''],
      providerPhone: [''],
      providerEmail: ['', this.emailValidator],
      plannedDate: [''],
      estimatedCost: ['', [Validators.min(0)]],
      notes: ['']
    });
  }

  private emailValidator(control: any) {
    if (!control.value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(control.value) ? null : { invalidEmail: true };
  }

  private loadCoproperties(): void {
    this.copropertyService.getCoproperties()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.coproperties.set(data);
          if (this.copropertyIdFromUrl) {
            const coproperty = data.find(c => c.id === this.copropertyIdFromUrl);
            if (coproperty) {
              this.selectedCoproperty.set(coproperty);
              this.interventionForm.patchValue({ copropertyId: coproperty.id });
            }
          }
        },
        error: (err) => {
          console.error('Error loading coproperties:', err);
          this.loading.set(false);
        }
      });
  }

  private checkEditMode(): void {
    this.interventionId = this.activatedRoute.snapshot.paramMap.get('id');
    if (this.interventionId) {
      this.isEditMode.set(true);
      this.loading.set(true);
      this.interventionService.getInterventionById(this.interventionId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (intervention) => {
            this.existingIntervention.set(intervention);
            this.interventionForm.patchValue({
              copropertyId: intervention.copropertyId,
              title: intervention.title,
              description: intervention.description,
              interventionType: this.normalizeInterventionType(intervention.interventionType as string),
              priority: this.normalizePriority(intervention.priority as string),
              status: this.normalizeStatus(intervention.status as string),
              providerName: intervention.providerName || '',
              providerPhone: intervention.providerPhone || '',
              providerEmail: intervention.providerEmail || '',
              plannedDate: intervention.plannedDate ? new Date(intervention.plannedDate).toISOString().split('T')[0] : '',
              estimatedCost: intervention.estimatedCost || '',
              notes: intervention.notes || ''
            });
            
            // Load coproperty details
            const coproperties = this.coproperties();
            const coproperty = coproperties.find(c => c.id === intervention.copropertyId);
            if (coproperty) {
              this.selectedCoproperty.set(coproperty);
            }
            
            this.loading.set(false);
          },
          error: (err) => {
            console.error('Error loading intervention:', err);
            this.loading.set(false);
          }
        });
    }
  }

  private checkCopropertyFromUrl(): void {
    this.copropertyIdFromUrl = this.activatedRoute.snapshot.queryParamMap.get('copropertyId');
  }

  /** Normalize GraphQL SCREAMING_SNAKE_CASE enum values to the PascalCase values expected by the form selects */
  private normalizeInterventionType(value: string): string {
    const map: Record<string, string> = {
      PLUMBING: 'Plumbing', ELECTRICITY: 'Electricity', ELEVATOR: 'Elevator',
      CLEANING: 'Cleaning', PAINTING: 'Painting', LOCKSMITH: 'Locksmith',
      GARDEN_MAINTENANCE: 'GardenMaintenance', PEST_CONTROL: 'PestControl',
      FIRE_SAFETY: 'FireSafety', ROOF_REPAIR: 'RoofRepair',
      COMMON_AREA_REPAIR: 'CommonAreaRepair', HEATING_COOLING: 'HeatingCooling',
      SECURITY_SYSTEM: 'SecuritySystem', WASTE_MANAGEMENT: 'WasteManagement', OTHER: 'Other'
    };
    return map[value] ?? value;
  }

  private normalizePriority(value: string): string {
    const map: Record<string, string> = {
      LOW: 'Low', NORMAL: 'Normal', HIGH: 'High', EMERGENCY: 'Emergency'
    };
    return map[value] ?? value;
  }

  private normalizeStatus(value: string): string {
    const map: Record<string, string> = {
      DRAFT: 'Draft', PLANNED: 'Planned', IN_PROGRESS: 'InProgress',
      COMPLETED: 'Completed', CANCELLED: 'Cancelled', INVOICED: 'Invoiced'
    };
    return map[value] ?? value;
  }

  onCopropertyChange(): void {
    const copropertyId = this.interventionForm.get('copropertyId')?.value;
    const coproperty = this.coproperties().find(c => c.id === copropertyId);
    this.selectedCoproperty.set(coproperty || null);
  }

  save(): void {
    if (this.interventionForm.invalid) {
      this.markFormGroupTouched(this.interventionForm);
      return;
    }

    this.saving.set(true);
    this.saveFailed.set(false);
    const formValue = this.interventionForm.value;

    if (this.isEditMode() && this.interventionId) {
      const input: UpdateInterventionInput = {
        id: this.interventionId,
        copropertyId: formValue.copropertyId,
        title: formValue.title,
        description: formValue.description,
        interventionType: formValue.interventionType,
        priority: formValue.priority,
        status: formValue.status,
        providerName: formValue.providerName || undefined,
        providerPhone: formValue.providerPhone || undefined,
        providerEmail: formValue.providerEmail || undefined,
        plannedDate: formValue.plannedDate || undefined,
        estimatedCost: formValue.estimatedCost ? parseFloat(formValue.estimatedCost) : undefined,
        notes: formValue.notes || undefined
      };

      this.interventionService.updateIntervention(input)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.saveSuccess.set(true);
            setTimeout(() => this.router.navigate(['/coproperty/syndic/interventions']), 1500);
          },
          error: (err) => {
            console.error('Error updating intervention:', err);
            this.saving.set(false);
            this.saveFailed.set(true);
          }
        });
    } else {
      const input: CreateInterventionInput = {
        copropertyId: formValue.copropertyId,
        title: formValue.title,
        description: formValue.description,
        interventionType: formValue.interventionType,
        priority: formValue.priority,
        providerName: formValue.providerName || undefined,
        providerPhone: formValue.providerPhone || undefined,
        providerEmail: formValue.providerEmail || undefined,
        plannedDate: formValue.plannedDate || undefined,
        estimatedCost: formValue.estimatedCost ? parseFloat(formValue.estimatedCost) : undefined,
        notes: formValue.notes || undefined
      };

      this.interventionService.createIntervention(input)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.saveSuccess.set(true);
            setTimeout(() => this.router.navigate(['/coproperty/syndic/interventions']), 1500);
          },
          error: (err) => {
            console.error('Error creating intervention:', err);
            this.saving.set(false);
            this.saveFailed.set(true);
          }
        });
    }
  }

  cancel(): void {
    this.router.navigate(['/coproperty/syndic/interventions']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.interventionForm.get(fieldName);
    if (!field?.errors || !field?.touched) return '';

    if (field.errors['required']) return `${fieldName} is required`;
    if (field.errors['minLength']) return `${fieldName} must be at least ${field.errors['minLength'].requiredLength} characters`;
    if (field.errors['min']) return `${fieldName} must be greater than ${field.errors['min'].min}`;
    if (field.errors['invalidEmail']) return 'Invalid email format';

    return 'Error';
  }
}
