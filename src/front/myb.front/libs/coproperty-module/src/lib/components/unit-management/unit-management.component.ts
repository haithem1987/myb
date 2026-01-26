import { Component, OnInit, signal, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { UnitService, UnitExtended } from '../../services/unit.service';
import { ToastService } from 'libs/shared/infra/services/toast.service';

@Component({
  selector: 'myb-unit-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, RouterModule],
  templateUrl: './unit-management.component.html',
  styleUrls: ['./unit-management.component.scss'],
})
export class UnitManagementComponent implements OnInit, OnChanges {
  @Input() copropertyId: string | null = null;
  
  private unitService = inject(UnitService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  units = signal<UnitExtended[]>([]);
  loading = signal(false);
  displayedColumns: string[] = ['unitNumber', 'floor', 'area', 'shares', 'status', 'owner', 'actions'];
  searchTerm: string = '';
  showAddForm: boolean = false;
  unitForm: FormGroup;
  editingUnitId: string | null = null;
  resolvedCopropertyId: string | null = null;

  unitTypes = ['APARTMENT', 'PARKING', 'CAVE', 'COMMERCIAL', 'OTHER'];

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
        this.toastService.show('Failed to load units. Please try again.', {
          classname: 'bg-danger text-light',
        });
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

  deleteUnit(unit: UnitExtended): void {
    if (confirm(`Are you sure you want to delete unit ${unit.unitNumber}?`)) {
      this.loading.set(true);
      this.unitService.deleteUnit(unit.id!).subscribe({
        next: () => {
          this.toastService.show(`Unit ${unit.unitNumber} deleted successfully!`, {
            classname: 'bg-success text-light',
          });
          this.loadUnits();
        },
        error: (err) => {
          console.error('Error deleting unit:', err);
          this.toastService.show('Failed to delete unit. Please try again.', {
            classname: 'bg-danger text-light',
          });
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
          const message = this.editingUnitId 
            ? `Unit ${unitData.unitNumber} updated successfully!`
            : `Unit ${unitData.unitNumber} created successfully!`;
          
          this.toastService.show(message, {
            classname: 'bg-success text-light',
          });
          
          this.showAddForm = false;
          this.unitForm.reset();
          this.loadUnits();
        },
        error: (err) => {
          console.error('Error saving unit:', err);
          
          // Check for duplicate unit number error
          const errorMessage = err?.error?.errors?.[0]?.message || err?.message || '';
          let displayMessage = 'Failed to save unit. Please try again.';
          
          if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
            displayMessage = `Unit number ${unitData.unitNumber} already exists for this coproperty. Please use a different unit number.`;
          }
          
          this.toastService.show(displayMessage, {
            classname: 'bg-danger text-light',
          });
          this.loading.set(false);
        }
      });
    } else {
      this.toastService.show('Please fill in all required fields correctly.', {
        classname: 'bg-warning text-dark',
      });
    }
  }

  cancelForm(): void {
    this.showAddForm = false;
    this.editingUnitId = null;
    this.unitForm.reset();
  }
}
