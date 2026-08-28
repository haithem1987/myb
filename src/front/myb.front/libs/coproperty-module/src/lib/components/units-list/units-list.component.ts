import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { UnitService, UnitExtended } from '../../services/unit.service';
import { CopropertyService } from '../../services/coproperty.service';
import { Coproperty } from '../../models/coproperty.models';
import { KeycloakService } from '@myb-front/auth';
import { forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, finalize } from 'rxjs/operators';
import { ToastService } from 'libs/shared/infra/services/toast.service';
import { ModalService } from '@myb-front/shared-ui';
import { getUnitErrorTranslation } from '../../utils/unit-error.util';

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
  private keycloakService = inject(KeycloakService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);
  private translateService = inject(TranslateService);
  private modalService = inject(ModalService);

  units = signal<UnitExtended[]>([]);
  coproperties = signal<Coproperty[]>([]);
  selectedCopropertyId = signal<string | null>(null);
  loading = signal<boolean>(false);
  searchTerm = signal<string>('');
  filterType = signal<string>('');
  filterOccupancy = signal<string>('');
  sortBy = signal<'newest' | 'oldest' | 'number' | 'area' | 'shares'>('newest');
  showAddForm = signal<boolean>(false);
  editingUnitId = signal<string | null>(null);

  unitTypes = ['APARTMENT', 'PARKING', 'CAVE', 'COMMERCIAL', 'VILLA', 'PENTHOUSE', 'STUDIO', 'HOUSE', 'OTHER'];
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
    const managerId = this.keycloakService.getSyndicManagerId();
    this.copropertyService.getCoproperties(managerId).subscribe({
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

    // The backend derives/enforces the authenticated syndic scope. The
    // managerId is also supplied for compatibility with deployments where
    // authentication claims are not yet available to the GraphQL resolver.
    const managerId = this.keycloakService.getSyndicManagerId();
    this.unitService.getAllUnitsBySyndic(managerId).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (allUnits) => {
        this.units.set(allUnits as any);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading units:', err);
        this.showAlert('danger', this.translateService.instant('coproperty.unit.noUnitsFound'));
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

  onSortChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.sortBy.set(select.value as any);
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

    // Apply sorting
    filtered = this.sortUnits(filtered);

    return filtered;
  }

  // Getter for occupied form control to avoid template type issues
  get occupiedControl(): FormControl {
    return this.unitForm.get('isOccupied') as FormControl;
  }

  private sortUnits(units: UnitExtended[]): UnitExtended[] {
    const sorted = [...units];
    const sortValue = this.sortBy();

    switch (sortValue) {
      case 'newest':
        // Sort by creation date descending (newest first)
        return sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      case 'oldest':
        // Sort by creation date ascending (oldest first)
        return sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        });
      case 'number':
        // Sort by unit number
        return sorted.sort((a, b) => a.unitNumber.localeCompare(b.unitNumber));
      case 'area':
        // Sort by area descending
        return sorted.sort((a, b) => (b.area || 0) - (a.area || 0));
      case 'shares':
        // Sort by shares descending
        return sorted.sort((a, b) => b.shares - a.shares);
      default:
        return sorted;
    }
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

  getFormCopropertyTotalShares(): number | null {
    const copropertyId = this.unitForm.get('copropertyId')?.value;
    return this.coproperties().find(coproperty => coproperty.id === copropertyId)?.totalShares ?? null;
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
      'VILLA': 'bg-success',
      'PENTHOUSE': 'bg-danger',
      'STUDIO': 'bg-info',
      'HOUSE': 'bg-success',
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

  async deleteUnit(unit: UnitExtended): Promise<void> {
    const confirmed = await this.modalService.confirm({
      title: this.translateService.instant('coproperty.unit.deleteConfirm'),
      message: `${this.translateService.instant('common.deleteMessage')}<br/>"<strong>${unit.unitNumber}</strong>"?<br/><br/><strong class="text-danger">${this.translateService.instant('coproperty.unit.deleteWarning')}</strong>`,
      confirmButtonText: this.translateService.instant('common.delete'),
      confirmButtonClass: 'btn-danger',
      cancelButtonText: this.translateService.instant('common.cancel')
    });

    if (confirmed) {
      this.loading.set(true);
      this.unitService.deleteUnit(unit.id!).subscribe({
        next: () => {
          // Keep the list in sync from the successful mutation itself. A second
          // list query is unnecessary and was the source of the erroneous
          // /graphql/timesheet refresh seen after a successful delete.
          this.units.update((units) => units.filter((item) => item.id !== unit.id));
          const successMsg = this.translateService.instant('coproperty.messages.unitDeleted', {
            unitNumber: unit.unitNumber,
          });
          this.showAlert('success', successMsg);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error deleting unit:', err);
          const errorMessage = getUnitErrorTranslation(err, 'delete', unit.unitNumber);
          const errorMsg = this.translateService.instant(errorMessage.key, errorMessage.params);
          this.showAlert('danger', errorMsg);
          this.loading.set(false);
        }
      });
    }
  }

  saveUnit(): void {
    if (this.unitForm.valid) {
      const unitData: UnitExtended = {
        ...this.unitForm.value,
        id: this.editingUnitId() || '00000000-0000-0000-0000-000000000000'
      };

      const coproperty = this.coproperties().find(item => item.id === unitData.copropertyId);
      const assignedShares = this.units()
        .filter(unit =>
          unit.copropertyId === unitData.copropertyId &&
          unit.id !== this.editingUnitId())
        .reduce((sum, unit) => sum + Number(unit.shares), 0);

      if (coproperty && assignedShares + Number(unitData.shares) > coproperty.totalShares) {
        const message = this.translateService.instant('coproperty.messages.unitSharesExceeded', {
          totalShares: coproperty.totalShares,
        });
        this.showAlert('danger', message);
        this.unitForm.get('shares')?.setErrors({ sharesExceeded: true });
        this.unitForm.get('shares')?.markAsTouched();
        return;
      }

      this.loading.set(true);

      const operation = this.editingUnitId() 
        ? this.unitService.updateUnit(unitData)
        : this.unitService.createUnit(unitData);

      operation.subscribe({
        next: (savedUnit) => {
          const copropertyName = this.coproperties()
            .find((coproperty) => coproperty.id === savedUnit.copropertyId)?.name;
          const enrichedUnit: UnitExtended = {
            ...savedUnit,
            copropertyName: savedUnit.copropertyName ?? copropertyName,
          };

          this.units.update((units) => {
            const existingIndex = units.findIndex((unit) => unit.id === enrichedUnit.id);
            if (existingIndex === -1) {
              return [enrichedUnit, ...units];
            }

            return units.map((unit) =>
              unit.id === enrichedUnit.id ? { ...unit, ...enrichedUnit } : unit
            );
          });
          const messageKey = this.editingUnitId() 
            ? 'coproperty.messages.unitUpdated'
            : 'coproperty.messages.unitCreated';
          
          const successMsg = this.translateService.instant(messageKey, {
            unitNumber: unitData.unitNumber,
          });
          this.showAlert('success', successMsg);
          
          this.showAddForm.set(false);
          this.editingUnitId.set(null);
          this.unitForm.reset();
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error saving unit:', err);
          
          const action = this.editingUnitId() ? 'update' : 'create';
          const errorMessage = getUnitErrorTranslation(err, action, unitData.unitNumber);
          const errorMsg = this.translateService.instant(errorMessage.key, errorMessage.params);
          this.showAlert('danger', errorMsg);
          this.loading.set(false);
        }
      });
    } else {
      this.unitForm.markAllAsTouched();
      const validationMsg = this.translateService.instant('coproperty.messages.unitFormInvalid');
      this.showAlert('warning', validationMsg);
    }
  }

  cancelForm(): void {
    this.showAddForm.set(false);
    this.editingUnitId.set(null);
    this.unitForm.reset();
  }

  private showAlert(type: 'success' | 'danger' | 'warning', message: string): void {
    this.alert.set({type, message});
    const duration = type === 'danger' ? 8000 : type === 'warning' ? 7000 : 5000;
    setTimeout(() => this.alert.set({type: null, message: ''}), duration);
  }
}
