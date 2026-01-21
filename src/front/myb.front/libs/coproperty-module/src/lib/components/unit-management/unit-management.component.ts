import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { UnitService, UnitExtended } from '../../services/unit.service';

@Component({
  selector: 'myb-unit-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, RouterModule],
  templateUrl: './unit-management.component.html',
  styleUrls: ['./unit-management.component.scss'],
})
export class UnitManagementComponent implements OnInit {
  private unitService = inject(UnitService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  units = signal<UnitExtended[]>([]);
  loading = signal(false);
  displayedColumns: string[] = ['unitNumber', 'floor', 'area', 'shares', 'status', 'owner', 'actions'];
  searchTerm: string = '';
  showAddForm: boolean = false;
  unitForm: FormGroup;
  editingUnitId: number | null = null;
  copropertyId: number = 0;

  unitTypes = ['APARTMENT', 'PARKING', 'CAVE', 'COMMERCIAL', 'OTHER'];

  constructor() {
    this.unitForm = this.fb.group({
      unitNumber: ['', [Validators.required, Validators.minLength(1)]],
      floor: [1, [Validators.required, Validators.min(0)]],
      area: [0, [Validators.required, Validators.min(1)]],
      shares: [0, [Validators.required, Validators.min(1)]],
      type: ['APARTMENT', Validators.required],
      ownerName: ['', Validators.required],
      ownerEmail: ['', Validators.email],
      ownerPhone: [''],
      isOccupied: [true, Validators.required],
      rentedTo: [''],
    });
  }

  ngOnInit(): void {
    // Get coproperty ID from route params
    this.route.params.subscribe(params => {
      this.copropertyId = +params['id'] || 0;
      if (this.copropertyId > 0) {
        this.loadUnits();
      }
    });
  }

  loadUnits(): void {
    if (!this.copropertyId || this.copropertyId === 0) {
      this.units.set([]);
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.unitService.getUnitsByCoproperty(this.copropertyId).subscribe({
      next: (data) => {
        this.units.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading units:', err);
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
        unit.type.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  openAddForm(): void {
    this.showAddForm = true;
    this.editingUnitId = null;
    this.unitForm.reset({ 
      type: 'APARTMENT', 
      isOccupied: true, 
      floor: 1,
      copropertyId: this.copropertyId 
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
      type: unit.type,
      ownerName: unit.ownerName,
      ownerEmail: unit.ownerEmail,
      ownerPhone: unit.ownerPhone,
      isOccupied: unit.isOccupied,
      rentedTo: unit.rentedTo,
    });
  }

  deleteUnit(unit: UnitExtended): void {
    if (confirm(`Are you sure you want to delete unit ${unit.unitNumber}?`)) {
      this.loading.set(true);
      this.unitService.deleteUnit(unit.id!).subscribe({
        next: () => {
          this.loadUnits();
        },
        error: (err) => {
          console.error('Error deleting unit:', err);
          this.loading.set(false);
          alert('Failed to delete unit');
        }
      });
    }
  }

  saveUnit(): void {
    if (this.unitForm.valid) {
      this.loading.set(true);
      const unitData: UnitExtended = {
        ...this.unitForm.value,
        copropertyId: this.copropertyId,
        ...(this.editingUnitId && { id: this.editingUnitId })
      };

      const operation = this.editingUnitId 
        ? this.unitService.updateUnit(unitData)
        : this.unitService.createUnit(unitData);

      operation.subscribe({
        next: () => {
          this.showAddForm = false;
          this.unitForm.reset();
          this.loadUnits();
        },
        error: (err) => {
          console.error('Error saving unit:', err);
          this.loading.set(false);
          alert('Failed to save unit');
        }
      });
    }
  }

  cancelForm(): void {
    this.showAddForm = false;
    this.editingUnitId = null;
    this.unitForm.reset();
  }
}
