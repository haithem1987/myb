import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { UnitService, UnitExtended } from '../../services/unit.service';
import { CopropertyService } from '../../services/coproperty.service';
import { Coproperty } from '../../models/coproperty.models';
import { forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, finalize } from 'rxjs/operators';
import { ToastService } from 'libs/shared/infra/services/toast.service';

@Component({
  selector: 'myb-units-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, NgbDropdownModule],
  templateUrl: './units-list.component.html',
  styleUrls: ['./units-list.component.scss'],
})
export class UnitsListComponent implements OnInit {
  private unitService = inject(UnitService);
  private copropertyService = inject(CopropertyService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);
  private translateService = inject(TranslateService);

  units = signal<UnitExtended[]>([]);
  coproperties = signal<Coproperty[]>([]);
  selectedCopropertyId = signal<string | null>(null);
  loading = signal<boolean>(false);
  searchTerm = signal<string>('');
  filterType = signal<string>('');
  filterOccupancy = signal<string>('');
  showAddForm = signal<boolean>(false);
  editingUnitId = signal<string | null>(null);

  unitTypes = ['APARTMENT', 'PARKING', 'CAVE', 'COMMERCIAL', 'OTHER'];
  unitForm: FormGroup;
  
  // Alert system
  alert = signal<{type: 'success' | 'danger' | 'warning' | null, message: string}>({type: null, message: ''});

  constructor() {
    this.unitForm = this.fb.group({
      copropertyId: ['', Validators.required],
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
    // Load coproperties first, then units
    this.loadCoproperties();
  }

  loadCoproperties(): void {
    this.copropertyService.getCoproperties().subscribe({
      next: (data) => {
        this.coproperties.set(data);
        // Load all units regardless of coproperties
        this.loadAllUnits();
      },
      error: (err) => {
        console.error('Error loading coproperties:', err);
        // Still try to load units even if coproperties fail
        this.loadAllUnits();
      }
    });
  }

  loadAllUnits(): void {
    this.loading.set(true);
    
    // Load all units - copropertyName now comes from GraphQL backend
    this.unitService.getAllUnits().pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (allUnits) => {
        this.units.set(allUnits as any);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading units:', err);
        this.showAlert('danger', 'Erreur lors du chargement des lots');
         this.loading.set(false);
      }
    });
  }

  onCopropertyChange(copropertyId: string): void {
    this.selectedCopropertyId.set(copropertyId);
    // Filter happens automatically through the filteredUnits getter
  }

  onCopropertyFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.onCopropertyChange(select.value);
  }

  onTypeFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterType.set(select.value);
  }

  onOccupancyFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterOccupancy.set(select.value);
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  get filteredUnits(): UnitExtended[] {
    let filtered = this.units();

    // Filter by coproperty
    const selectedCoproperty = this.selectedCopropertyId();
    if (selectedCoproperty && selectedCoproperty !== 'all') {
      filtered = filtered.filter(unit => unit.copropertyId === selectedCoproperty);
    }

    // Filter by search term
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(unit => 
        unit.unitNumber.toLowerCase().includes(term) ||
        unit.description?.toLowerCase().includes(term) ||
        (unit as any).copropertyName?.toLowerCase().includes(term)
      );
    }

    // Filter by type
    if (this.filterType()) {
      filtered = filtered.filter(unit => unit.unitType === this.filterType());
    }

    // Filter by occupancy
    if (this.filterOccupancy()) {
      const isOccupied = this.filterOccupancy() === 'occupied';
      filtered = filtered.filter(unit => unit.isOccupied === isOccupied);
    }

    return filtered;
  }

  getOccupiedUnitsCount(): number {
    return this.filteredUnits.filter(unit => unit.isOccupied).length;
  }

  getVacantUnitsCount(): number {
    return this.filteredUnits.filter(unit => !unit.isOccupied).length;
  }

  getTotalArea(): number {
    return this.filteredUnits.reduce((sum, unit) => sum + (unit.area || 0), 0);
  }

  getTotalShares(): number {
    return this.filteredUnits.reduce((sum, unit) => sum + unit.shares, 0);
  }

  viewUnit(unit: UnitExtended): void {
    // Navigate to coproperty detail with units tab
    this.router.navigate(['/coproperty/syndic/coproperties', unit.copropertyId], { 
      queryParams: { tab: 'units' } 
    });
  }

  getUnitTypeBadgeClass(type: string): string {
    const typeMap: { [key: string]: string } = {
      'APARTMENT': 'bg-primary',
      'PARKING': 'bg-info',
      'CAVE': 'bg-secondary',
      'COMMERCIAL': 'bg-warning',
      'OTHER': 'bg-dark'
    };
    return typeMap[type] || 'bg-secondary';
  }

  getUnitTypeLabel(type: string): string {
    const typeKey = type.toLowerCase();
    return this.translateService.instant(`coproperty.unit.types.${typeKey}`);
  }

  getOccupancyBadgeClass(isOccupied: boolean): string {
    return isOccupied ? 'bg-success' : 'bg-warning';
  }

  getOccupancyLabel(isOccupied: boolean): string {
    const key = isOccupied ? 'coproperty.unit.occupied' : 'coproperty.unit.vacant';
    return this.translateService.instant(key);
  }

  getCopropertyName(unit: UnitExtended): string {
    return (unit as any).copropertyName || '';
  }

  formatArea(area: number | undefined): string {
    if (!area) return '-';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(area);
  }

  openAddForm(): void {
    this.showAddForm.set(true);
    this.editingUnitId.set(null);
    this.unitForm.reset({ 
      unitType: 'APARTMENT', 
      isOccupied: true, 
      floor: 1,
      area: 0,
      shares: 0,
      copropertyId: this.selectedCopropertyId() || ''
    });
  }

  editUnit(unit: UnitExtended): void {
    this.editingUnitId.set(unit.id || null);
    this.showAddForm.set(true);
    this.unitForm.patchValue({
      copropertyId: unit.copropertyId,
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
    this.translateService.get('coproperty.unit.deleteConfirm').subscribe((confirmMsg) => {
      if (confirm(confirmMsg)) {
        this.loading.set(true);
        this.unitService.deleteUnit(unit.id!).subscribe({
          next: () => {
            this.translateService.get('coproperty.messages.deleted').subscribe((msg) => {
              this.showAlert('success', msg);
            });
            this.loadAllUnits();
          },
          error: (err) => {
            console.error('Error deleting unit:', err);
            this.translateService.get('coproperty.messages.error').subscribe((msg) => {
              this.showAlert('danger', msg);
            });
            this.loading.set(false);
          }
        });
      }
    });
  }

  saveUnit(): void {
    if (this.unitForm.valid) {
      this.loading.set(true);
      const unitData: UnitExtended = {
        ...this.unitForm.value,
        id: this.editingUnitId() || '00000000-0000-0000-0000-000000000000'
      };

      const operation = this.editingUnitId() 
        ? this.unitService.updateUnit(unitData)
        : this.unitService.createUnit(unitData);

      operation.subscribe({
        next: () => {
          const messageKey = this.editingUnitId() 
            ? 'coproperty.messages.updated'
            : 'coproperty.messages.created';
          
          this.translateService.get(messageKey).subscribe((msg) => {
            this.showAlert('success', msg);
          });
          
          this.showAddForm.set(false);
          this.unitForm.reset();
          this.loadAllUnits();
        },
        error: (err) => {
          console.error('Error saving unit:', err);
          
          const errorMessage = err?.error?.errors?.[0]?.message || err?.message || '';
          let translationKey = 'coproperty.messages.saveFailed';
          
          if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
            translationKey = 'coproperty.unit.duplicateError';
          }
          
          this.translateService.get(translationKey).subscribe((msg) => {
            this.showAlert('danger', msg);
          });
          this.loading.set(false);
        }
      });
    } else {
      this.translateService.get('validation.required').subscribe((msg) => {
        this.showAlert('warning', msg);
      });
    }
  }

  cancelForm(): void {
    this.showAddForm.set(false);
    this.editingUnitId.set(null);
    this.unitForm.reset();
  }

  private showAlert(type: 'success' | 'danger' | 'warning', message: string): void {
    this.alert.set({type, message});
    setTimeout(() => this.alert.set({type: null, message: ''}), 5000);
  }
}
