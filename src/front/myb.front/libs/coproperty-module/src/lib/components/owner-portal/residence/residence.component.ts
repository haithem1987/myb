import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin, of, switchMap, take } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { KeycloakService } from '@myb-front/auth';
import { Coproperty, CurrencyService, OwnerService, Unit } from '../../../index';
import { ChargeDistributionPayment, ChargeService } from '../../../services/charge.service';
import { CopropertyService } from '../../../services/coproperty.service';
import { FundCallExtended, FundCallService } from '../../../services/fund-call.service';
import { NoResultComponent } from '@myb-front/shared-ui';
import { ActiveCopropertyService } from '../../../services/active-coproperty.service';

interface ResidenceBudgetLine {
  id: string;
  description: string;
  budgeted: number;
  paid: number;
  remaining: number;
  currency: string;
}

interface ResidenceDistribution extends ChargeDistributionPayment {
  copropertyId: string;
}

@Component({
  selector: 'app-owner-residence',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, NoResultComponent],
  templateUrl: './residence.component.html',
  styleUrls: ['./residence.component.scss'],
})
export class OwnerResidenceComponent implements OnInit {
  private ownerService = inject(OwnerService);
  private chargeService = inject(ChargeService);
  private fundCallService = inject(FundCallService);
  private copropertyService = inject(CopropertyService);
  private keycloakService = inject(KeycloakService);
  private currencyService = inject(CurrencyService);
  private activeCoproperty = inject(ActiveCopropertyService);

  loading = signal(true);
  error = signal(false);
  units = signal<Unit[]>([]);
  distributions = signal<ResidenceDistribution[]>([]);
  fundCalls = signal<FundCallExtended[]>([]);
  coproperties = signal<Coproperty[]>([]);
  selectedCopropertyId = signal('');
  copropertyOverdueTotals = signal<Record<string, number>>({});

  associatedCoproperties = computed(() => {
    const ids = new Set(this.units().map(unit => unit.copropertyId));
    return this.coproperties().filter(coproperty => ids.has(coproperty.id));
  });

  filteredUnits = computed(() => this.units().filter(unit =>
    !this.selectedCopropertyId() || unit.copropertyId === this.selectedCopropertyId()
  ));

  filteredDistributions = computed(() => this.distributions().filter(item =>
    !this.selectedCopropertyId() || item.copropertyId === this.selectedCopropertyId()
  ));

  activeFundCalls = computed(() => this.fundCalls().filter(item =>
    (!this.selectedCopropertyId() || item.copropertyId === this.selectedCopropertyId()) &&
    item.isActive !== false && item.status !== 'CANCELLED'
  ));

  selectedCoproperty = computed(() =>
    this.associatedCoproperties().find(coproperty => coproperty.id === this.selectedCopropertyId())
  );

  selectedCurrency = computed(() => this.selectedCoproperty()?.currency ?? 'EUR');

  approvedPaymentTotal = computed(() => this.activeFundCalls().reduce(
    (total, fundCall) => total + (fundCall.payments ?? [])
      .filter(payment => this.normalizePaymentStatus(payment.validationStatus) === 'APPROVED')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    0
  ));

  budgetLines = computed<ResidenceBudgetLine[]>(() => {
    const grouped = new Map<string, ResidenceBudgetLine>();
    for (const item of this.filteredDistributions()) {
      const currency = this.selectedCurrency();
      const key = item.chargeId;
      const current = grouped.get(key) ?? {
        id: key,
        description: item.chargeName || item.chargeDescription || '—',
        budgeted: 0,
        paid: 0,
        remaining: 0,
        currency,
      };
      current.budgeted += Number(item.amount || 0);
      grouped.set(key, current);
    }

    // Approved fund-call payments are the accounting source used by the
    // syndic and owner dashboards. ChargeDistribution.PaidAmount is a legacy
    // online-payment field and is not updated when a syndic approves a proof.
    // Allocate the coproperty-level collected amount across its budget lines
    // so this overview stays reconciled with the operational ledger.
    const lines = [...grouped.values()];
    const totalBudgeted = lines.reduce((sum, line) => sum + line.budgeted, 0);
    const totalPaid = Math.min(totalBudgeted, this.approvedPaymentTotal());
    let allocated = 0;
    return lines.map((line, index) => {
      const paid = index === lines.length - 1
        ? Math.max(0, totalPaid - allocated)
        : totalBudgeted > 0
          ? Math.min(line.budgeted, totalPaid * (line.budgeted / totalBudgeted))
          : 0;
      allocated += paid;
      return {
        ...line,
        paid,
        remaining: Math.max(0, line.budgeted - paid),
      };
    });
  });

  financialSummary = computed(() => {
    const items = this.filteredDistributions();
    const activeFundCalls = this.activeFundCalls();
    const budgeted = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const paid = Math.min(budgeted, this.approvedPaymentTotal());
    return {
      budgeted: this.formatSelectedAmount(budgeted),
      paid: this.formatSelectedAmount(paid),
      unpaid: this.formatSelectedAmount(activeFundCalls.reduce((sum, fundCall) => {
        const approved = (fundCall.payments ?? [])
          .filter(payment => this.normalizePaymentStatus(payment.validationStatus) === 'APPROVED')
          .reduce((paymentSum, payment) => paymentSum + Number(payment.amount || 0), 0);
        return sum + (approved === 0 ? Number(fundCall.amount || 0) : 0);
      }, 0)),
      // Overdue is the coproperty-wide total (all owners), not just this owner's fund calls.
      overdue: this.formatSelectedAmount(this.copropertyOverdueTotals()[this.selectedCopropertyId()] ?? 0),
      remaining: this.formatSelectedAmount(Math.max(0, budgeted - paid)),
      totalShares: [...new Map(items.map(item => [item.unitId, Number(item.shares || 0)])).values()]
        .reduce((sum, shares) => sum + shares, 0),
      unitCount: new Set(items.map(item => item.unitId)).size,
      activeBudgetLines: this.budgetLines().filter(item => item.remaining > 0).length,
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

  getPaidAmount(item: ChargeDistributionPayment): number {
    const explicitPaid = Number(item.paidAmount || 0);
    const normalizedStatus = String(item.paymentStatus ?? '').replace(/[_\s-]/g, '').toUpperCase();
    return explicitPaid > 0 ? explicitPaid : normalizedStatus === 'PAID' ? Number(item.amount || 0) : 0;
  }

  getRemainingAmount(item: ChargeDistributionPayment): number {
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
    forkJoin({
        owner: this.ownerService.getOwnerByUserId(userId).pipe(take(1), catchError(() => of(null))),
        units: this.ownerService.getMyUnits(userId).pipe(take(1), catchError(() => of([] as Unit[]))),
        coproperties: this.copropertyService.getCoproperties().pipe(take(1), catchError(() => of([] as Coproperty[]))),
      }).pipe(
        switchMap(({ owner, units, coproperties }) => {
          const associatedIds = [...new Set(units.map(unit => unit.copropertyId))];
          const distributionRequests = associatedIds.map(copropertyId =>
            this.chargeService.getCopropertyChargeDistributions(copropertyId).pipe(
              take(1),
              switchMap(items => of(items.map(item => ({ ...item, copropertyId })))),
              catchError(() => of([] as ResidenceDistribution[]))
            )
          );
          const overdueRequests = associatedIds.map(copropertyId =>
            this.fundCallService.getCopropertyOverdueTotal(copropertyId).pipe(
              take(1),
              switchMap(total => of({ copropertyId, total })),
              catchError(() => of({ copropertyId, total: 0 }))
            )
          );
          return forkJoin({
            distributions: distributionRequests.length
              ? forkJoin(distributionRequests)
              : of([] as ResidenceDistribution[][]),
            overdueSummaries: overdueRequests.length
              ? forkJoin(overdueRequests)
              : of([] as { copropertyId: string; total: number }[]),
            fundCalls: owner?.id
              ? this.fundCallService.getFundCallsByOwner(owner.id).pipe(
              take(1),
              catchError(() => of([] as FundCallExtended[]))
            )
              : of([] as FundCallExtended[]),
          }).pipe(
            switchMap(({ distributions, overdueSummaries, fundCalls }) => of({
              units,
              coproperties,
              distributions: distributions.flat(),
              overdueSummaries,
              fundCalls,
            }))
          );
        })
      ).subscribe({
      next: ({ units, coproperties, distributions, overdueSummaries, fundCalls }) => {
        this.units.set(units);
        this.coproperties.set(coproperties);
        this.distributions.set(distributions);
        this.copropertyOverdueTotals.set(
          Object.fromEntries(
            overdueSummaries.map(({ copropertyId, total }) => [copropertyId, total])
          )
        );
        this.fundCalls.set(fundCalls);
        this.selectedCopropertyId.set(
          this.activeCoproperty.selectAvailable(this.associatedCoproperties(), this.selectedCopropertyId())
        );
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  onCopropertyChange(copropertyId: string): void {
    this.selectedCopropertyId.set(copropertyId);
    this.activeCoproperty.setActive(copropertyId);
  }

  private formatSelectedAmount(amount: number): string {
    return this.currencyService.formatAmount(amount, this.selectedCurrency());
  }

  private normalizePaymentStatus(status: string | null | undefined): string {
    return String(status ?? '').replace(/[_\s-]/g, '').toUpperCase();
  }
}
