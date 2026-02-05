import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { UnitService, UnitExtended } from '../../services/unit.service';
import { CopropertyService } from '../../services/coproperty.service';
import { Coproperty } from '../../models/coproperty.models';
import { forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, finalize, switchMap } from 'rxjs/operators';

@Component({
  selector: 'myb-units-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './units-list.component.html',
  styleUrls: ['./units-list.component.scss'],
})
export class UnitsListComponent implements OnInit {
  private unitService = inject(UnitService);
  private copropertyService = inject(CopropertyService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  units = signal<UnitExtended[]>([]);
  coproperties = signal<Coproperty[]>([]);
  selectedCopropertyId = signal<string | null>(null);
  loading = signal<boolean>(false);
  searchTerm = signal<string>('');
  filterType = signal<string>('');
  filterOccupancy = signal<string>('');

  unitTypes = ['APARTMENT', 'PARKING', 'CAVE', 'COMMERCIAL', 'OTHER'];

  ngOnInit(): void {
    this.loadCoproperties();
    this.loadAllUnits();
  }

  loadCoproperties(): void {
    this.copropertyService.getCoproperties().subscribe({
      next: (data) => {
        this.coproperties.set(data);
      },
      error: (err) => {
        console.error('Error loading coproperties:', err);
      }
    });
  }

  loadAllUnits(): void {
    this.loading.set(true);
    this.copropertyService.getCoproperties()
      .pipe(
        switchMap((coproperties) => {
          if (coproperties.length === 0) {
            this.units.set([]);
            return of([]);
          }

          const unitRequests = coproperties.map(coproperty =>
            this.unitService.getUnitsByCoproperty(coproperty.id).pipe(
              map(units => ({
                units,
                copropertyName: coproperty.name
              }))
            )
          );

          return forkJoin(unitRequests).pipe(
            map(results => results.flatMap(result =>
              result.units.map(unit => ({
                ...unit,
                copropertyName: result.copropertyName
              } as any))
            ))
          );
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (allUnits) => {
          this.units.set(allUnits);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading units:', err);
          this.loading.set(false);
        }
      });
  }

  onCopropertyChange(copropertyId: string): void {
    this.selectedCopropertyId.set(copropertyId);
    
    if (!copropertyId || copropertyId === 'all') {
      this.loadAllUnits();
    } else {
      this.loading.set(true);
      this.unitService.getUnitsByCoproperty(copropertyId)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.loading.set(false))
        )
        .subscribe({
          next: (units) => {
            const coproperty = this.coproperties().find(c => c.id === copropertyId);
            const unitsWithCoproperty = units.map(unit => ({
              ...unit,
              copropertyName: coproperty?.name || ''
            } as any));
            this.units.set(unitsWithCoproperty);
            this.loading.set(false);
          },
          error: (err) => {
            console.error('Error loading units:', err);
            this.loading.set(false);
          }
        });
    }
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
    const labels: { [key: string]: string } = {
      'APARTMENT': 'Appartement',
      'PARKING': 'Parking',
      'CAVE': 'Cave',
      'COMMERCIAL': 'Commercial',
      'OTHER': 'Autre'
    };
    return labels[type] || type;
  }

  getOccupancyBadgeClass(isOccupied: boolean): string {
    return isOccupied ? 'bg-success' : 'bg-warning';
  }

  getOccupancyLabel(isOccupied: boolean): string {
    return isOccupied ? 'Occupé' : 'Vacant';
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
}
