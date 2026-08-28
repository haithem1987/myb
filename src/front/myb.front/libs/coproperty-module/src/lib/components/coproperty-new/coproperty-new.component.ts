import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CopropertyService } from '../../services/coproperty.service';
import { CreateCopropertyInput, Coproperty, Currency } from '../../models/coproperty.model';
import { KeycloakService } from '@myb-front/auth';
import { Observable, of } from 'rxjs';
import { map, catchError, debounceTime, first } from 'rxjs/operators';
import { ToastService } from '@myb-front/shared-ui';

@Component({
  selector: 'myb-coproperty-new',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  templateUrl: './coproperty-new.component.html',
  styleUrls: ['./coproperty-new.component.scss'],
})
export class CopropertyNewComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private copropertyService = inject(CopropertyService);
  private keycloakService = inject(KeycloakService);
  private toastService = inject(ToastService);
  private translateService = inject(TranslateService);

  activeTab = signal<string>('info');
  copropertyForm!: FormGroup;
  isEditMode = signal<boolean>(false);
  copropertyId = signal<string | null>(null);
  saving = signal<boolean>(false);
  saveSuccess = signal<boolean>(false);
  private currentManagerName: string | undefined;
  // Currency is configured separately in Settings; preserve the existing value
  // (or default to EUR for a brand-new coproperty) instead of exposing it here.
  private currentCurrency: Currency = Currency.EUR;

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

  // Create async validator for duplicate name check
  private duplicateNameValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      const excludeId = this.isEditMode() ? this.copropertyId() || undefined : undefined;

      return this.copropertyService.checkCopropertyNameExists(control.value, excludeId).pipe(
        debounceTime(500),
        map(exists => exists ? { duplicateName: true } : null),
        catchError(() => of(null)),
        first()
      );
    };
  }

  initializeForm(): void {
    this.copropertyForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)], [this.duplicateNameValidator()]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      country: ['France', [Validators.required]],
      description: [''],
      totalUnits: [0, [Validators.required, Validators.min(1)]],
      totalShares: [0, [Validators.required, Validators.min(1)]],
      isActive: [true, [Validators.required]],
      commonAreas: ['']
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
          isActive: coproperty.isActive,
          commonAreas: coproperty.commonAreas
        });
        this.currentManagerName = coproperty.managerName || undefined;
        // Currency is managed via Settings, not this form — preserve the existing value.
        this.currentCurrency = coproperty.currency || Currency.EUR;
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
      currency: this.currentCurrency,
      postalCode: formData.postalCode,
      country: formData.country ?? 'France',
      description: formData.description,
      totalUnits: formData.totalUnits,
      totalShares: formData.totalShares,
      commonAreas: formData.commonAreas,
      managerId: this.keycloakService.getProfile()?.id || undefined,
      managerName: this.currentManagerName,
      isActive: formData.isActive
    };

    const save$ = this.isEditMode() && this.copropertyId()
      ? this.copropertyService.updateCoproperty(this.copropertyId()!, payload)
      : this.copropertyService.createCoproperty(payload);

    save$.subscribe({
      next: (coproperty) => {
        this.saving.set(false);
        this.saveSuccess.set(true);
        
        // Show success message then navigate to list after 2 seconds
        setTimeout(() => {
          this.saveSuccess.set(false);
          this.router.navigate(['/coproperty/syndic/coproperties']);
        }, 2000);
      },
      error: (error) => {
        this.saving.set(false);
        this.saveSuccess.set(false);
        console.error('Failed to save coproperty', error);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/coproperty/syndic/coproperties']);
  }

  get formTitle(): string {
    return this.isEditMode() ? 'coproperty.form.editCoproperty' : 'coproperty.form.newCoproperty';
  }
}
