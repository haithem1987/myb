import { Component, OnInit, signal, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { UnitService, UnitExtended } from '../../services/unit.service';
import { ToastService } from 'libs/shared/infra/services/toast.service';
import { ModalService } from '@myb-front/shared-ui';
import { getUnitErrorTranslation } from '../../utils/unit-error.util';

@Component({
  selector: 'myb-unit-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, RouterModule, NgbDropdownModule],
  templateUrl: './unit-management.component.html',
  styleUrls: ['./unit-management.component.scss'],
})
export class UnitManagementComponent implements OnInit, OnChanges {
  @Input() copropertyId: string | null = null;
  
  private unitService = inject(UnitService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);
  private translateService = inject(TranslateService);
  private modalService = inject(ModalService);

  units = signal<UnitExtended[]>([]);
  loading = signal(false);
  displayedColumns: string[] = ['unitNumber', 'floor', 'area', 'shares', 'status', 'owner', 'actions'];
  searchTerm: string = '';
  showAddForm: boolean = false;
  unitForm: FormGroup;
  editingUnitId: string | null = null;
  resolvedCopropertyId: string | null = null;
  
  // Alert system
  alert = signal<{type: 'success' | 'danger' | 'warning' | null, message: string}>({type: null, message: ''});

  unitTypes = ['APARTMENT', 'PARKING', 'CAVE', 'COMMERCIAL', 'VILLA', 'PENTHOUSE', 'STUDIO', 'HOUSE', 'OTHER'];

  constructor() {
    this.unitForm = this.fb.group({
      unitNumber: ['', [Validators.required, Validators.minLength(1)]],
      floor: [1, [Validators.required, Validators.min(0)]],
      area: [0, [Validators.required, Validators.min(1)]],
      shares: [0, [Validators.required, Validators.min(1)]],
      unitType: ['APARTMENT', Validators.required],
      description: [''],
      isOccupied: [true, Validators.required]
    });
  }

  ngOnInit(): void {
    // Get coproperty ID from input or parent route params
    if (this.copropertyId) {
      this.resolvedCopropertyId = this.copropertyId;
      this.loadUnits();
    } else {
      this.route.parent?.params.subscribe(params => {
        const idFromRoute = params['id'];
        if (idFromRoute) {
          this.resolvedCopropertyId = idFromRoute;
          this.loadUnits();
        }
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['copropertyId'] && !changes['copropertyId'].firstChange) {
      this.resolvedCopropertyId = this.copropertyId;
      if (this.copropertyId) {
        this.loadUnits();
      }
    }
  }

  loadUnits(): void {
    if (!this.resolvedCopropertyId) {
      this.units.set([]);
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.unitService.getUnitsByCoproperty(this.resolvedCopropertyId).subscribe({
      next: (data) => {
        this.units.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading units:', err);
        this.showAlert('danger', this.translateService.instant('coproperty.messages.unitLoadFailed'));
        this.loading.set(false);
      }
    });
  }

  get filteredUnits(): UnitExtended[] {
    const allUnits = this.units();
    if (!this.searchTerm) {
      return allUnits;
    }
    return allUnits.filter(
      (unit) =>
        unit.unitNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        unit.unitType?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  openAddForm(): void {
    this.showAddForm = true;
    this.editingUnitId = null;
    this.unitForm.reset({ 
      unitType: 'APARTMENT', 
      isOccupied: true, 
      floor: 1,
      copropertyId: this.resolvedCopropertyId
    });
  }

  editUnit(unit: UnitExtended): void {
    this.editingUnitId = unit.id || null;
    this.showAddForm = true;
    this.unitForm.patchValue({
      unitNumber: unit.unitNumber,
      floor: unit.floor,
      area: unit.area,
      shares: unit.shares,
      unitType: unit.unitType,
      description: unit.description,
      isOccupied: unit.isOccupied
    });
  }

  async deleteUnit(unit: UnitExtended): Promise<void> {
    const confirmed = await this.modalService.confirm({
      title: this.translateService.instant('coproperty.unit.deleteConfirm'),
      message: this.translateService.instant('coproperty.unit.deleteDetailedConfirm', {
        unitNumber: unit.unitNumber,
      }),
      confirmButtonText: this.translateService.instant('common.delete'),
      confirmButtonClass: 'btn-danger',
      cancelButtonText: this.translateService.instant('common.cancel'),
    });

    if (confirmed) {
      this.loading.set(true);
      this.unitService.deleteUnit(unit.id!).subscribe({
        next: () => {
          this.showAlert(
            'success',
            this.translateService.instant('coproperty.messages.unitDeleted', {
              unitNumber: unit.unitNumber,
            })
          );
          this.loadUnits();
        },
        error: (err) => {
          console.error('Error deleting unit:', err);
          const errorMessage = getUnitErrorTranslation(err, 'delete', unit.unitNumber);
          this.showAlert(
            'danger',
            this.translateService.instant(errorMessage.key, errorMessage.params)
          );
          this.loading.set(false);
        }
      });
    }
  }

  saveUnit(): void {
    if (this.unitForm.valid) {
      this.loading.set(true);
      const unitData: UnitExtended = {
        ...this.unitForm.value,
        copropertyId: this.resolvedCopropertyId,
        id: this.editingUnitId || '00000000-0000-0000-0000-000000000000'
      };

      const operation = this.editingUnitId 
        ? this.unitService.updateUnit(unitData)
        : this.unitService.createUnit(unitData);

      operation.subscribe({
        next: () => {
          const message = this.translateService.instant(
            this.editingUnitId
              ? 'coproperty.messages.unitUpdated'
              : 'coproperty.messages.unitCreated',
            { unitNumber: unitData.unitNumber }
          );
          
          this.showAlert('success', message);
          
          this.showAddForm = false;
          this.unitForm.reset();
          this.loadUnits();
        },
        error: (err) => {
          console.error('Error saving unit:', err);
          const action = this.editingUnitId ? 'update' : 'create';
          const errorMessage = getUnitErrorTranslation(err, action, unitData.unitNumber);
          this.showAlert(
            'danger',
            this.translateService.instant(errorMessage.key, errorMessage.params)
          );
          this.loading.set(false);
        }
      });
    } else {
      this.unitForm.markAllAsTouched();
      this.showAlert(
        'warning',
        this.translateService.instant('coproperty.messages.unitFormInvalid')
      );
    }
  }

  cancelForm(): void {
    this.showAddForm = false;
    this.editingUnitId = null;
    this.unitForm.reset();
  }

  private showAlert(type: 'success' | 'danger' | 'warning', message: string): void {
    this.alert.set({type, message});
    const duration = type === 'danger' ? 8000 : type === 'warning' ? 7000 : 5000;
    setTimeout(() => this.alert.set({type: null, message: ''}), duration);
  }
}
