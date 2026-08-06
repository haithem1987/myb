import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { ChargeService, ChargeExtended } from '../../services/charge.service';
import { CopropertyService } from '../../services/coproperty.service';
import { CurrencyService } from '../../services/currency.service';
import { Coproperty } from '../../models/coproperty.models';
import { KeycloakService } from '@myb-front/auth';
import { forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, finalize, switchMap } from 'rxjs/operators';
import { ChargeDistributionComponent } from '../charge-distribution/charge-distribution.component';

@Component({
  selector: 'myb-charges-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterModule, NgbDropdownModule, ChargeDistributionComponent],
  templateUrl: './charges-list.component.html',
  styleUrls: ['./charges-list.component.scss'],
})
export class ChargesListComponent implements OnInit {
  private chargeService = inject(ChargeService);
  private copropertyService = inject(CopropertyService);
  private currencyService = inject(CurrencyService);
  private keycloakService = inject(KeycloakService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  charges = signal<ChargeExtended[]>([]);
  coproperties = signal<Coproperty[]>([]);
  selectedCopropertyId = signal<string | null>(null);
  loading = signal<boolean>(false);
  activeSection = signal<'budget-lines' | 'allocation'>('budget-lines');
  searchTerm = signal<string>('');
  filterType = signal<string>('');
  readonly currentYear = new Date().getFullYear().toString();
  filterFrequency = signal<string>(this.currentYear);

  chargeTypes = ['CLEANING', 'MAINTENANCE', 'INSURANCE', 'ELEVATOR', 'HEATING', 'WATER', 'ELECTRICITY', 'GARDENING', 'SECURITY', 'OTHER'];

  ngOnInit(): void {
    if (this.route.snapshot.routeConfig?.path === 'distribution') {
      this.activeSection.set('allocation');
    }

    this.loadCoproperties();
    this.loadAllCharges();
    
    // Listen for navigation with refresh param to reload data
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params['section'] === 'allocation') {
          this.activeSection.set('allocation');
        } else if (this.route.snapshot.routeConfig?.path !== 'distribution') {
          this.activeSection.set('budget-lines');
        }

        if (params['year']) {
          this.filterFrequency.set(String(params['year']));
        }

        if (params['refresh']) {
          this.loadAllCharges();
          // Clean up the URL by removing the refresh param
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true
          });
        }
      });
  }

  setSection(section: 'budget-lines' | 'allocation'): void {
    this.activeSection.set(section);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { section: section === 'allocation' ? 'allocation' : null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  get frequencies(): string[] {
    const currentYear = new Date().getFullYear();
    const years = new Set<number>(
      Array.from({ length: 11 }, (_, index) => currentYear - index)
    );

    for (const charge of this.charges()) {
      const frequencyYear = Number(charge.frequency);
      const startDateYear = charge.startDate
        ? new Date(charge.startDate).getFullYear()
        : Number.NaN;

      if (Number.isInteger(frequencyYear)) years.add(frequencyYear);
      if (Number.isInteger(startDateYear)) years.add(startDateYear);
    }

    return [...years]
      .sort((a, b) => b - a)
      .map(String);
  }

  loadCoproperties(): void {
    const managerId = this.keycloakService.getSyndicManagerId();
    this.copropertyService.getCoproperties(managerId).subscribe({
      next: (data) => {
        this.coproperties.set(data);
        // Auto-select first coproperty by default
        if (data.length > 0 && !this.selectedCopropertyId()) {
          this.onCopropertyChange(data[0].id);
        }
      },
      error: (err) => {
        console.error('Error loading coproperties:', err);
      }
    });
  }

  loadAllCharges(): void {
    this.loading.set(true);
    const managerId = this.keycloakService.getSyndicManagerId();
    this.copropertyService.getCoproperties(managerId)
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
                copropertyName: coproperty.name,
                copropertyCurrency: coproperty.currency
              }))
            )
          );

          return forkJoin(chargeRequests).pipe(
            map(results => results.flatMap(result =>
              result.charges.map(charge => ({
                ...charge,
                copropertyName: result.copropertyName,
                currency: charge.currency ?? result.copropertyCurrency
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
              copropertyName: coproperty?.name || '',
              currency: charge.currency ?? coproperty?.currency
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

    return [...filtered].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (dateA !== dateB) {
        return dateB - dateA;
      }
      const fallbackA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const fallbackB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return fallbackB - fallbackA;
    });
  }

  getTotalBudgetAmount(): number {
    return this.filteredCharges.reduce((sum, charge) => sum + (charge.totalAmount || 0), 0);
  }

  getActiveChargesCount(): number {
    return this.filteredCharges.filter(charge => charge.isActive).length;
  }

  getCurrentYearCount(): number {
    const currentYear = new Date().getFullYear().toString();
    return this.filteredCharges.filter(charge => charge.frequency === currentYear).length;
  }

  get selectedCurrency(): string | undefined {
    const selectedId = this.selectedCopropertyId();
    return this.coproperties().find(c => c.id === selectedId)?.currency;
  }

  getTotalBudgetDisplay(): string {
    return this.formatCurrencyGroups(
      this.filteredCharges.map(charge => ({
        amount: charge.totalAmount || 0,
        currency: charge.currency
          ?? this.coproperties().find(c => c.id === charge.copropertyId)?.currency
      }))
    );
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

  getChargeTypeTranslationKey(type: string): string {
    return `coproperty.charges.types.${type.toLowerCase()}`;
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

  formatAmount(amount: number, currency?: string): string {
    return this.currencyService.formatAmount(amount, currency);
  }

  private formatCurrencyGroups(
    values: Array<{ amount: number; currency?: string }>
  ): string {
    const totals = new Map<string, number>();
    for (const value of values) {
      const currency = value.currency ?? this.currencyService.current;
      totals.set(currency, (totals.get(currency) ?? 0) + value.amount);
    }

    if (totals.size === 0) {
      return this.currencyService.formatAmount(0, this.selectedCurrency);
    }

    return [...totals.entries()]
      .map(([currency, amount]) => this.currencyService.formatAmount(amount, currency))
      .join(' · ');
  }

  deleteCharge(charge: ChargeExtended): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la charge "${charge.name}" ?

Cette action est irréversible.`)) {
      if (charge.id) {
        this.loading.set(true);
        this.chargeService.deleteCharge(charge.id, charge.copropertyId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.loading.set(false);
              this.loadAllCharges();
            },
            error: (err) => {
              console.error('Error deleting charge:', err);
              this.loading.set(false);
              alert('Erreur lors de la suppression de la charge');
            }
          });
      }
    }
  }
}
