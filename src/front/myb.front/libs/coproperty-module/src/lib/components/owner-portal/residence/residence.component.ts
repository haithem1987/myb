import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin, of, switchMap, take } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { KeycloakService } from '@myb-front/auth';
import { ChargeDistribution, Coproperty, CurrencyService, OwnerService, Unit } from '../../../index';
import { CopropertyService } from '../../../services/coproperty.service';

@Component({
  selector: 'app-owner-residence',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './residence.component.html',
  styleUrls: ['./residence.component.scss'],
})
export class OwnerResidenceComponent implements OnInit {
  private ownerService = inject(OwnerService);
  private copropertyService = inject(CopropertyService);
  private keycloakService = inject(KeycloakService);
  private currencyService = inject(CurrencyService);

  loading = signal(true);
  error = signal(false);
  units = signal<Unit[]>([]);
  distributions = signal<ChargeDistribution[]>([]);
  coproperties = signal<Coproperty[]>([]);
  selectedCopropertyId = signal('');

  associatedCoproperties = computed(() => {
    const ids = new Set([
      ...this.units().map(unit => unit.copropertyId),
      ...this.distributions().map(item => item.copropertyId).filter((id): id is string => !!id),
    ]);
    return this.coproperties().filter(coproperty => ids.has(coproperty.id));
  });

  filteredUnits = computed(() => this.units().filter(unit =>
    !this.selectedCopropertyId() || unit.copropertyId === this.selectedCopropertyId()
  ));

  filteredDistributions = computed(() => this.distributions().filter(item =>
    !this.selectedCopropertyId() || item.copropertyId === this.selectedCopropertyId()
  ));

  financialSummary = computed(() => {
    const items = this.filteredDistributions();
    return {
      budgeted: this.formatGrouped(items, item => Number(item.amount || 0)),
      paid: this.formatGrouped(items, item => this.getPaidAmount(item)),
      unpaid: this.formatGrouped(items, item => this.getPaidAmount(item) === 0 ? Number(item.amount || 0) : 0),
      remaining: this.formatGrouped(items, item => Math.max(0, Number(item.amount || 0) - this.getPaidAmount(item))),
      totalShares: this.filteredUnits().reduce((sum, unit) => sum + Number(unit.shares || 0), 0),
      activeBudgetLines: items.filter(item => this.getRemainingAmount(item) > 0).length,
    };
  });

  ngOnInit(): void {
    this.loadResidence();
  }

  reload(): void {
    this.loadResidence();
  }

  formatAmount(amount: number, currency?: string): string {
    return this.currencyService.formatAmount(amount, currency);
  }

  getPaidAmount(item: ChargeDistribution): number {
    const explicitPaid = Number(item.paidAmount || 0);
    const normalizedStatus = String(item.paymentStatus ?? '').replace(/[_\s-]/g, '').toUpperCase();
    return explicitPaid > 0 ? explicitPaid : normalizedStatus === 'PAID' ? Number(item.amount || 0) : 0;
  }

  getRemainingAmount(item: ChargeDistribution): number {
    return Math.max(0, Number(item.amount || 0) - this.getPaidAmount(item));
  }

  private loadResidence(): void {
    const userId = this.keycloakService.getUserId() ?? this.keycloakService.getProfile()?.id;
    if (!userId) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(false);
    this.ownerService.getOwnerByUserId(userId).pipe(
      take(1),
      switchMap(owner => forkJoin({
        units: this.ownerService.getMyUnits(userId).pipe(take(1), catchError(() => of([] as Unit[]))),
        coproperties: this.copropertyService.getCoproperties().pipe(take(1), catchError(() => of([] as Coproperty[]))),
        distributions: owner?.id
          ? this.ownerService.getOwnerChargeDistributions(owner.id).pipe(take(1), catchError(() => of([] as ChargeDistribution[])))
          : of([] as ChargeDistribution[]),
      })),
    ).subscribe({
      next: ({ units, coproperties, distributions }) => {
        this.units.set(units);
        this.coproperties.set(coproperties);
        this.distributions.set(distributions);
        if (this.associatedCoproperties().length === 1) {
          this.selectedCopropertyId.set(this.associatedCoproperties()[0].id);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  private formatGrouped(
    items: ChargeDistribution[],
    amountSelector: (item: ChargeDistribution) => number
  ): string {
    const totals = new Map<string, number>();
    for (const item of items) {
      const currency = item.currency ?? this.currencyService.current;
      totals.set(currency, (totals.get(currency) ?? 0) + amountSelector(item));
    }
    if (totals.size === 0) return this.currencyService.formatAmount(0);
    return [...totals.entries()]
      .map(([currency, amount]) => this.currencyService.formatAmount(amount, currency))
      .join(' · ');
  }
}
