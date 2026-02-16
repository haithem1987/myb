import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router, RouterModule } from '@angular/router';
import { ChargeService, ChargeExtended } from '../../services/charge.service';
import { CopropertyService } from '../../services/coproperty.service';
import { Coproperty } from '../../models/coproperty.models';
import { forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, finalize, switchMap } from 'rxjs/operators';

@Component({
  selector: 'myb-charges-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterModule],
  templateUrl: './charges-list.component.html',
  styleUrls: ['./charges-list.component.scss'],
})
export class ChargesListComponent implements OnInit {
  private chargeService = inject(ChargeService);
  private copropertyService = inject(CopropertyService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  charges = signal<ChargeExtended[]>([]);
  coproperties = signal<Coproperty[]>([]);
  selectedCopropertyId = signal<string | null>(null);
  loading = signal<boolean>(false);
  searchTerm = signal<string>('');
  filterType = signal<string>('');
  filterFrequency = signal<string>('');

  chargeTypes = ['CLEANING', 'MAINTENANCE', 'INSURANCE', 'ELEVATOR', 'HEATING', 'WATER', 'ELECTRICITY', 'GARDENING', 'SECURITY', 'OTHER'];
  frequencies = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

  ngOnInit(): void {
    this.loadCoproperties();
    this.loadAllCharges();
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

  loadAllCharges(): void {
    this.loading.set(true);
    this.copropertyService.getCoproperties()
      .pipe(
        switchMap((coproperties) => {
          if (coproperties.length === 0) {
            this.charges.set([]);
            return of([]);
          }

          const chargeRequests = coproperties.map(coproperty =>
            this.chargeService.getChargesByCoproperty(coproperty.id).pipe(
              map(charges => ({
                charges,
                copropertyName: coproperty.name
              }))
            )
          );

          return forkJoin(chargeRequests).pipe(
            map(results => results.flatMap(result =>
              result.charges.map(charge => ({
                ...charge,
                copropertyName: result.copropertyName
              } as any))
            ))
          );
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (allCharges) => {
          this.charges.set(allCharges);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading charges:', err);
          this.loading.set(false);
        }
      });
  }

  onCopropertyChange(copropertyId: string): void {
    this.selectedCopropertyId.set(copropertyId);
    
    if (!copropertyId || copropertyId === 'all') {
      this.loadAllCharges();
    } else {
      this.loading.set(true);
      this.chargeService.getChargesByCoproperty(copropertyId)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.loading.set(false))
        )
        .subscribe({
          next: (charges) => {
            const coproperty = this.coproperties().find(c => c.id === copropertyId);
            const chargesWithCoproperty = charges.map(charge => ({
              ...charge,
              copropertyName: coproperty?.name || ''
            } as any));
            this.charges.set(chargesWithCoproperty);
            this.loading.set(false);
          },
          error: (err) => {
            console.error('Error loading charges:', err);
            this.loading.set(false);
          }
        });
    }
  }

  get filteredCharges(): ChargeExtended[] {
    let filtered = this.charges();

    // Filter by search term
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(charge => 
        charge.name.toLowerCase().includes(term) ||
        charge.description?.toLowerCase().includes(term) ||
        (charge as any).copropertyName?.toLowerCase().includes(term)
      );
    }

    // Filter by type
    if (this.filterType()) {
      filtered = filtered.filter(charge => charge.chargeType === this.filterType());
    }

    // Filter by frequency
    if (this.filterFrequency()) {
      filtered = filtered.filter(charge => charge.frequency === this.filterFrequency());
    }

    return filtered;
  }

  getActiveChargesCount(): number {
    return this.filteredCharges.filter(charge => charge.isActive).length;
  }

  getCurrentYearCount(): number {
    const currentYear = new Date().getFullYear().toString();
    return this.filteredCharges.filter(charge => charge.frequency === currentYear).length;
  }

  viewCharge(charge: ChargeExtended): void {
    // Navigate to coproperty detail with charges tab
    this.router.navigate(['/coproperty/syndic/coproperties', charge.copropertyId], { 
      queryParams: { tab: 'charges' } 
    });
  }

  getChargeTypeBadgeClass(type: string): string {
    const typeMap: { [key: string]: string } = {
      'CLEANING': 'bg-info',
      'MAINTENANCE': 'bg-warning',
      'INSURANCE': 'bg-primary',
      'ELEVATOR': 'bg-secondary',
      'HEATING': 'bg-danger',
      'WATER': 'bg-info',
      'ELECTRICITY': 'bg-warning',
      'GARDENING': 'bg-success',
      'SECURITY': 'bg-dark',
      'OTHER': 'bg-secondary'
    };
    return typeMap[type] || 'bg-secondary';
  }

  getFrequencyLabel(frequency: string): string {
    const labels: { [key: string]: string } = {
      'MONTHLY': 'Mensuel',
      'QUARTERLY': 'Trimestriel',
      'ANNUALLY': 'Annuel',
      'ONE_TIME': 'Ponctuel'
    };
    return labels[frequency] || frequency;
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'bg-success' : 'bg-secondary';
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Actif' : 'Inactif';
  }

  getCopropertyName(charge: ChargeExtended): string {
    return (charge as any).copropertyName || '';
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}
