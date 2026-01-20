import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';

interface Unit {
  id: string;
  unitNumber: string;
  copropertyId: string;
  floor: number;
  area: number;
  shares: number;
  unitType: string;
  occupancyStatus: string;
  owners: any[];
}

@Component({
  selector: 'myb-unit-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, RouterModule],
  templateUrl: './unit-management.component.html',
  styleUrls: ['./unit-management.component.scss'],
})
export class UnitManagementComponent implements OnInit {
  units: Unit[] = [];
  displayedColumns: string[] = ['unitNumber', 'floor', 'area', 'shares', 'occupancyStatus', 'actions'];
  searchTerm: string = '';
  showAddForm: boolean = false;
  unitForm: FormGroup;
  editingUnitId: string | null = null;

  unitTypes = ['T1', 'T2', 'T3', 'T4', 'T5'];
  occupancyStatuses = ['Occupied', 'Vacant', 'Rented'];

  constructor(private fb: FormBuilder) {
    this.unitForm = this.fb.group({
      unitNumber: ['', [Validators.required, Validators.minLength(1)]],
      floor: [1, [Validators.required, Validators.min(0)]],
      area: [0, [Validators.required, Validators.min(1)]],
      shares: [0, [Validators.required, Validators.min(1)]],
      unitType: ['T2', Validators.required],
      occupancyStatus: ['Occupied', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadUnits();
  }

  loadUnits(): void {
    // TODO: Implement GraphQL query to fetch units
    // Mock data for now
    this.units = [
      {
        id: '1',
        unitNumber: 'A101',
        copropertyId: '1',
        floor: 1,
        area: 75.5,
        shares: 500,
        unitType: 'T2',
        occupancyStatus: 'Occupied',
        owners: [{ firstName: 'Jean', lastName: 'Dupont', ownershipPercentage: 100 }],
      },
      {
        id: '2',
        unitNumber: 'A102',
        copropertyId: '1',
        floor: 1,
        area: 65.0,
        shares: 450,
        unitType: 'T1',
        occupancyStatus: 'Vacant',
        owners: [],
      },
      {
        id: '3',
        unitNumber: 'B201',
        copropertyId: '1',
        floor: 2,
        area: 100.0,
        shares: 650,
        unitType: 'T3',
        occupancyStatus: 'Occupied',
        owners: [{ firstName: 'Marie', lastName: 'Martin', ownershipPercentage: 100 }],
      },
    ];
  }

  get filteredUnits(): Unit[] {
    if (!this.searchTerm) {
      return this.units;
    }
    return this.units.filter(
      (unit) =>
        unit.unitNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        unit.unitType.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  openAddForm(): void {
    this.showAddForm = true;
    this.editingUnitId = null;
    this.unitForm.reset({ unitType: 'T2', occupancyStatus: 'Occupied', floor: 1 });
  }

  editUnit(unit: Unit): void {
    this.editingUnitId = unit.id;
    this.showAddForm = true;
    this.unitForm.patchValue({
      unitNumber: unit.unitNumber,
      floor: unit.floor,
      area: unit.area,
      shares: unit.shares,
      unitType: unit.unitType,
      occupancyStatus: unit.occupancyStatus,
    });
  }

  deleteUnit(unit: Unit): void {
    if (confirm(`Are you sure you want to delete unit ${unit.unitNumber}?`)) {
      // TODO: Implement GraphQL mutation to delete unit
      this.units = this.units.filter((u) => u.id !== unit.id);
    }
  }

  saveUnit(): void {
    if (this.unitForm.valid) {
      const formValue = this.unitForm.value;
      // TODO: Implement GraphQL mutation to create/update unit
      alert('Unit saved successfully');
      this.showAddForm = false;
      this.unitForm.reset();
    }
  }

  cancelForm(): void {
    this.showAddForm = false;
    this.editingUnitId = null;
    this.unitForm.reset();
  }
}
