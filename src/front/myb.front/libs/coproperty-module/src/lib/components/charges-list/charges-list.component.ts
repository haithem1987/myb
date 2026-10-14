import { Component, OnInit, signal, computed, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { NgbDropdownModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ChargeService, ChargeExtended } from '../../services/charge.service';
import { CopropertyService } from '../../services/coproperty.service';
import { CurrencyService } from '../../services/currency.service';
import { Coproperty } from '../../models/coproperty.models';
import { KeycloakService } from '@myb-front/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { ChargeDistributionComponent } from '../charge-distribution/charge-distribution.component';
import { ModalService, ToastService, NoResultComponent } from '@myb-front/shared-ui';
import { ActiveCopropertyService } from '../../services/active-coproperty.service';

@Component({
  selector: 'myb-charges-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterModule, NgbDropdownModule, NgbPaginationModule, ChargeDistributionComponent, NoResultComponent],
  templateUrl: './charges-list.component.html',
  styleUrls: ['./charges-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChargesListComponent implements OnInit {
  private chargeService = inject(ChargeService);
  private copropertyService = inject(CopropertyService);
  private currencyService = inject(CurrencyService);
  private keycloakService = inject(KeycloakService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private modalService = inject(ModalService);
  private toastService = inject(ToastService);
  private translateService = inject(TranslateService);
  private activeCoproperty = inject(ActiveCopropertyService);

  charges = signal<ChargeExtended[]>([]);
  coproperties = signal<Coproperty[]>([]);
  selectedCopropertyId = signal<string | null>(null);
  loading = signal<boolean>(false);
  activeSection = signal<'budget-lines' | 'allocation'>('budget-lines');
  searchTerm = signal<string>('');
  filterType = signal<string>('');
  readonly currentYear = new Date().getFullYear().toString();
  filterFrequency = signal<string>(this.currentYear);
  page = signal<number>(1);
  readonly pageSize = 10;

  chargeTypes = ['CLEANING', 'MAINTENANCE', 'INSURANCE', 'ELEVATOR', 'HEATING', 'WATER', 'ELECTRICITY', 'GARDENING', 'SECURITY', 'OTHER'];

  ngOnInit(): void {
    if (this.route.snapshot.routeConfig?.path === 'distribution') {
      this.activeSection.set('allocation');
    }

    this.loadCoproperties();
    
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
          this.setFilterFrequency(String(params['year']));
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

  readonly frequencies = computed<string[]>(() => {
    const currentYear = new Date().getFullYear();
    const years = new Set<number>(
      Array.from({ length: 11 }, (_, index) => currentYear - index)
    );

    for (const charge of this.charges()) {
      for (const year of this.chargeYears(charge)) years.add(year);
    }

    return [...years]
      .sort((a, b) => b - a)
      .map(String);
  });

  /** Years covered by a charge; `frequency` may hold a year or a label such as "Annual". */
  private chargeYears(charge: ChargeExtended): number[] {
    const years: number[] = [];
    const frequencyYear = Number(charge.frequency);
    if (Number.isInteger(frequencyYear) && frequencyYear > 0) {
      return [frequencyYear];
    }

    const start = charge.startDate ? new Date(charge.startDate).getFullYear() : Number.NaN;
    const end = charge.endDate ? new Date(charge.endDate).getFullYear() : start;
    if (Number.isInteger(start)) {
      const last = Number.isInteger(end) && end >= start ? end : start;
      for (let year = start; year <= last; year++) years.push(year);
    }
    return years;
  }

  setFilterType(value: string): void {
    this.filterType.set(value);
    this.page.set(1);
  }

  setFilterFrequency(value: string): void {
    this.filterFrequency.set(value);
    this.page.set(1);
  }

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
    this.page.set(1);
  }

  loadCoproperties(): void {
    const managerId = this.keycloakService.getSyndicManagerId();
    this.copropertyService.getCoproperties(managerId).subscribe({
      next: (data) => {
        this.coproperties.set(data);
        const selectedId = this.activeCoproperty.selectAvailable(
          data,
          this.route.snapshot.queryParamMap.get('copropertyId') || this.selectedCopropertyId()
        );
        this.selectedCopropertyId.set(selectedId || null);

        if (this.selectedCopropertyId()) {
          this.loadAllCharges();
        } else {
          this.charges.set([]);
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Error loading coproperties:', err);
      }
    });
  }

  loadAllCharges(): void {
    const copropertyId = this.selectedCopropertyId();
    if (!copropertyId) {
      this.charges.set([]);
      this.loading.set(false);
      return;
    }

    this.loadChargesByCoproperty(copropertyId);
  }

  onCopropertyChange(copropertyId: string): void {
    this.selectedCopropertyId.set(copropertyId || null);
    this.activeCoproperty.setActive(copropertyId);

    if (!copropertyId) {
      this.charges.set([]);
      return;
    }

    this.loadChargesByCoproperty(copropertyId);
  }

  private loadChargesByCoproperty(copropertyId: string): void {
    this.loading.set(true);
    this.chargeService.getChargesByCoproperty(copropertyId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (charges) => {
          const coproperty = this.coproperties().find(c => c.id === copropertyId);
          this.charges.set(charges.map(charge => ({
            ...charge,
            copropertyName: coproperty?.name || '',
            currency: charge.currency ?? coproperty?.currency
          } as ChargeExtended)));
        },
        error: (err) => {
          console.error('Error loading charges:', err);
          this.charges.set([]);
        }
      });
  }

  readonly filteredCharges = computed<ChargeExtended[]>(() => {
    let filtered = this.charges();

    const searchTerm = this.searchTerm();
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(charge => 
        charge.name.toLowerCase().includes(term) ||
        charge.description?.toLowerCase().includes(term) ||
        (charge as any).copropertyName?.toLowerCase().includes(term)
      );
    }

    const type = this.filterType();
    if (type) {
      filtered = filtered.filter(charge => charge.chargeType === type);
    }

    const year = Number(this.filterFrequency());
    if (this.filterFrequency() && Number.isInteger(year)) {
      filtered = filtered.filter(charge => this.chargeYears(charge).includes(year));
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
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredCharges().length / this.pageSize))
  );

  readonly pagedCharges = computed<ChargeExtended[]>(() => {
    const page = Math.min(this.page(), this.totalPages());
    const start = (page - 1) * this.pageSize;
    return this.filteredCharges().slice(start, start + this.pageSize);
  });

  readonly activeChargesCount = computed(() =>
    this.filteredCharges().filter(charge => charge.isActive).length
  );

  readonly totalBudgetDisplay = computed(() =>
    this.formatCurrencyGroups(
      this.filteredCharges().map(charge => ({
        amount: charge.totalAmount || 0,
        currency: charge.currency
          ?? this.coproperties().find(c => c.id === charge.copropertyId)?.currency
      }))
    )
  );

  trackByChargeId(_: number, charge: ChargeExtended): string | undefined {
    return charge.id;
  }

  get selectedCurrency(): string | undefined {
    const selectedId = this.selectedCopropertyId();
    return this.coproperties().find(c => c.id === selectedId)?.currency;
  }

  getSelectedCopropertyName(): string {
    const selectedId = this.selectedCopropertyId();
    if (!selectedId) return '';
    return this.coproperties().find(coproperty => coproperty.id === selectedId)?.name ?? '';
  }

  isSelectedCopropertyActive(): boolean {
    const selectedId = this.selectedCopropertyId();
    return !!selectedId && this.coproperties().some(
      coproperty => coproperty.id === selectedId && coproperty.isActive
    );
  }

  syndicRoute(...segments: Array<string | undefined>): string[] {
    return this.activeCoproperty.route(
      'syndic',
      ...segments.filter((segment): segment is string => !!segment)
    );
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

  async deleteCharge(charge: ChargeExtended): Promise<void> {
    if (!charge.id || !this.isSelectedCopropertyActive()) return;

    const confirmed = await this.modalService.confirm({
      title: this.translateService.instant('coproperty.charges.deleteCharge'),
      message: this.translateService.instant('coproperty.charges.deleteDetailedConfirm', {
        name: charge.name,
      }),
      confirmButtonText: this.translateService.instant('common.delete'),
      confirmButtonClass: 'btn-danger',
      cancelButtonText: this.translateService.instant('common.cancel'),
    });

    if (!confirmed) return;

    this.loading.set(true);
    this.chargeService.deleteCharge(charge.id, charge.copropertyId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.charges.update((charges) =>
            charges.filter((item) => item.id !== charge.id)
          );
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error deleting charge:', err);
          this.loading.set(false);
          this.toastService.show(
            this.translateService.instant('coproperty.messages.error'),
            { classname: 'bg-danger text-light' }
          );
        }
      });
  }
}
