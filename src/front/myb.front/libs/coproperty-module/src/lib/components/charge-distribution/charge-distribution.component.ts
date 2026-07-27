import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChargeService, ChargeExtended } from '../../services/charge.service';
import { CopropertyService } from '../../services/coproperty.service';
import { CurrencyService } from '../../services/currency.service';
import { FundCallService } from '../../services/fund-call.service';
import { OwnerService } from '../../services/owner.service';
import { UnitService } from '../../services/unit.service';
import { OwnerWithUnits } from '../../models/owner.model';
import { AddFundCallPaymentInput, CreateFundCallInput } from '../../models/fund-call.model';
import { Coproperty } from '../../models/coproperty.models';
import { KeycloakService } from '@myb-front/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from 'libs/shared/infra/services/toast.service';
import { forkJoin, of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';

interface Unit {
  id: string;
  unitNumber: string;
  area: number;
  shares: number;
  owners: { id?: string; firstName: string; lastName: string }[];
}

interface DistributionPreview {
  unitId: string;
  unitNumber: string;
  ownerId?: string;
  ownerName: string;
  area: number;
  shares: number;
  amount: number;
  percentage: number;
  /** Optional: record an immediate payment when saving */
  paymentDate?: string;
  paymentAmount?: number;
}

enum DistributionMethod {
  ByShares = 'shares',
  ByArea = 'area',
  Equal = 'equal',
  Custom = 'custom',
}

@Component({
  selector: 'myb-charge-distribution',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './charge-distribution.component.html',
  styleUrls: ['./charge-distribution.component.scss'],
})
export class ChargeDistributionComponent implements OnInit {
  private chargeService = inject(ChargeService);
  private copropertyService = inject(CopropertyService);
  private currencyService = inject(CurrencyService);
  private keycloakService = inject(KeycloakService);
  private fundCallService = inject(FundCallService);
  private ownerService = inject(OwnerService);
  private unitService = inject(UnitService);
  private fb = inject(FormBuilder);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private toastService = inject(ToastService);

  loadedOwners = signal<OwnerWithUnits[]>([]);
  /** IDs of charges that already have ChargeDistribution records (already distributed) */
  distributedChargeIds = signal<Set<string>>(new Set());

  repartitionForm: FormGroup;
  coproperties = signal<Coproperty[]>([]);
  selectedCoproperty = signal<Coproperty | null>(null);
  charges = signal<ChargeExtended[]>([]);
  loading = signal<boolean>(false);
  loadingCharges = signal<boolean>(false);
  saving = signal<boolean>(false);
  saveSuccess = signal<boolean>(false);

  units: Unit[] = [];
  distributionPreview: DistributionPreview[] = [];
  showPreview: boolean = false;

  DistributionMethod = DistributionMethod;
  selectedMethod: DistributionMethod = DistributionMethod.ByShares;
  Math = Math;

  totalShares: number = 0;
  totalArea: number = 0;

  years: number[] = [];

  // Computed total from budgets for the selected coproperty & year
  calculatedTotal = signal<number>(0);

  constructor() {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 2; i <= currentYear + 5; i++) {
      this.years.push(i);
    }

    this.repartitionForm = this.fb.group({
      copropertyId: ['', Validators.required],
      year: [currentYear.toString(), Validators.required],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.loadCoproperties();
    this.checkQueryParams();
  }

  private checkQueryParams(): void {
    this.activatedRoute.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const copropertyId = params.get('copropertyId');
        if (copropertyId) {
          this.repartitionForm.patchValue({ copropertyId });
          this.onCopropertyChange(copropertyId);
        }
      });
  }

  private loadCoproperties(): void {
    this.loading.set(true);
    const managerId = this.keycloakService.getSyndicManagerId();
    this.copropertyService.getCoproperties(managerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.coproperties.set(data);
          this.loading.set(false);
          // If coproperty already selected via query param, load charges
          const currentId = this.repartitionForm.get('copropertyId')?.value;
          if (currentId) {
            const cop = data.find(c => c.id === currentId);
            if (cop) this.selectedCoproperty.set(cop);
            this.loadChargesForCoproperty(currentId);
          } else if (data.length > 0) {
            // Auto-select first coproperty by default
            this.onCopropertyChange(data[0].id);
          }
        },
        error: (err) => {
          console.error('Error loading coproperties:', err);
          this.loading.set(false);
        }
      });
  }

  onCopropertyChange(copropertyId: string): void {
    const coproperty = this.coproperties().find(c => c.id === copropertyId);
    this.selectedCoproperty.set(coproperty || null);
    this.repartitionForm.patchValue({ copropertyId });
    if (copropertyId) {
      this.loadChargesForCoproperty(copropertyId);
    } else {
      this.charges.set([]);
      this.calculatedTotal.set(0);
    }
    this.showPreview = false;
    this.distributionPreview = [];
  }

  onYearChange(): void {
    const copropertyId = this.repartitionForm.get('copropertyId')?.value;
    if (copropertyId) {
      this.recalculateTotal();
    }
    this.showPreview = false;
    this.distributionPreview = [];
  }

  private loadChargesForCoproperty(copropertyId: string): void {
    this.loadingCharges.set(true);

    // Load charges, owners and units in parallel.
    // take(1) is required on all three because watchQuery never completes on its own,
    // which would prevent forkJoin from ever emitting.
    forkJoin({
      charges: this.chargeService
        .getChargesByCoproperty(copropertyId)
        .pipe(take(1), catchError((err) => this.handleLoadError('budgets', err))),
      owners: this.ownerService
        .getAllOwners(copropertyId)
        .pipe(take(1), catchError((err) => this.handleLoadError('owners', err))),
      units: this.unitService
        .getUnitsByCoproperty(copropertyId)
        .pipe(take(1), catchError((err) => this.handleLoadError('units', err))),
      distributions: this.chargeService
        .getCopropertyChargeDistributions(copropertyId)
        .pipe(take(1), catchError((err) => this.handleLoadError('distribution history', err))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ charges, owners, units, distributions }) => {
          // Build set of charge IDs that already have distributions (already distributed)
          const alreadyDistributed = new Set<string>(distributions.map(d => d.chargeId));
          this.distributedChargeIds.set(alreadyDistributed);

          this.charges.set(charges);
          this.loadedOwners.set(owners);

          // Map real units and attach the matching owner from ownerUnits relationships
          this.units = units.map((u) => {
            const matchingOwner = owners.find((o) =>
              o.ownerUnits?.some((ou) => ou.unitId === u.id)
            );
            return {
              id: u.id!,
              unitNumber: u.unitNumber,
              area: u.area ?? 0,
              shares: u.shares ?? 0,
              owners: matchingOwner
                ? [{ id: matchingOwner.id, firstName: matchingOwner.firstName, lastName: matchingOwner.lastName }]
                : [],
            };
          });

          this.calculateTotals();
          this.recalculateTotal();
          this.loadingCharges.set(false);
        },
        error: (err) => {
          console.error('Error loading coproperty data:', err);
          this.loadingCharges.set(false);
        },
      });
  }

  private handleLoadError(entity: string, err: unknown) {
    console.error(`[ChargeDistribution] Failed to load ${entity}:`, err);
    this.toastService.show(
      `Impossible de charger ${entity}. Vérifiez le service GraphQL et réessayez.`,
      { classname: 'bg-warning text-dark', delay: 5000 }
    );
    return of([]);
  }

  private recalculateTotal(): void {
    const filtered = this.getFilteredCharges();
    const total = filtered.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
    this.calculatedTotal.set(total);
  }

  getChargesForSelectedYear(): ChargeExtended[] {
    const year = parseInt(this.repartitionForm.get('year')?.value, 10);
    return this.charges().filter(c => new Date(c.startDate).getFullYear() === year);
  }

  getFilteredCharges(): ChargeExtended[] {
    const year = parseInt(this.repartitionForm.get('year')?.value, 10);
    const distributed = this.distributedChargeIds();
    return this.charges().filter(c =>
      new Date(c.startDate).getFullYear() === year && (!c.id || !distributed.has(c.id))
    );
  }

  get currencySymbol(): string {
    return this.currencyService.symbol;
  }

  formatAmount(amount: number): string {
    return this.currencyService.formatAmount(amount);
  }

  // Distribution calculation logic
  calculateTotals(): void {
    this.totalShares = this.units.reduce((sum, u) => sum + u.shares, 0);
    this.totalArea = this.units.reduce((sum, u) => sum + u.area, 0);
  }

  calculateDistribution(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    const totalAmount = this.calculatedTotal();
    // eslint-disable-next-line no-console
    console.log('[ChargeDistribution] calculateDistribution', {
      totalAmount,
      unitsCount: this.units.length,
      formValid: this.repartitionForm.valid,
      selectedMethod: this.selectedMethod,
      filteredCharges: this.getFilteredCharges().length,
    });
    if (!totalAmount || totalAmount <= 0 || this.units.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('[ChargeDistribution] calculateDistribution early-return: ' +
        (!totalAmount || totalAmount <= 0 ? 'no charges' : 'no units'));
      this.toastService.show(
        !totalAmount || totalAmount <= 0
          ? 'Aucun budget à répartir pour les filtres sélectionnés.'
          : 'Aucun lot disponible pour calculer la répartition.',
        { classname: 'bg-info text-white', delay: 4000 }
      );
      return;
    }

    this.calculateTotals();

    if (this.selectedMethod === DistributionMethod.ByShares && this.totalShares <= 0) {
      this.toastService.show(
        'Impossible de répartir par tantièmes: le total des tantièmes est nul.',
        { classname: 'bg-warning text-dark', delay: 5000 }
      );
      return;
    }

    if (this.selectedMethod === DistributionMethod.ByArea && this.totalArea <= 0) {
      this.toastService.show(
        'Impossible de répartir par surface: la surface totale est nulle.',
        { classname: 'bg-warning text-dark', delay: 5000 }
      );
      return;
    }

    this.distributionPreview = [];

    switch (this.selectedMethod) {
      case DistributionMethod.ByShares:
        this.distributionByShares(totalAmount);
        break;
      case DistributionMethod.ByArea:
        this.distributionByArea(totalAmount);
        break;
      case DistributionMethod.Equal:
        this.distributionEqual(totalAmount);
        break;
      case DistributionMethod.Custom:
        this.initializeCustomDistribution(totalAmount);
        break;
    }
    this.showPreview = true;
  }

  /** Resolve a real owner ID from loaded owners by matching display name */
  private resolveOwnerId(ownerName: string): string | undefined {
    if (!ownerName || ownerName === 'Non assigné') return undefined;
    const match = this.loadedOwners().find(
      (o) => `${o.firstName} ${o.lastName}`.toLowerCase() === ownerName.toLowerCase()
    );
    return match?.id;
  }

  private distributionByShares(totalAmount: number): void {
    this.units.forEach((unit) => {
      const percentage = (unit.shares / this.totalShares) * 100;
      const amount = (totalAmount * unit.shares) / this.totalShares;
      const ownerName = unit.owners.length > 0 ? `${unit.owners[0].firstName} ${unit.owners[0].lastName}` : 'Non assigné';
      this.distributionPreview.push({
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        ownerId: unit.owners[0]?.id ?? this.resolveOwnerId(ownerName),
        ownerName,
        area: unit.area,
        shares: unit.shares,
        amount: Math.round(amount * 100) / 100,
        percentage: Math.round(percentage * 100) / 100,
      });
    });
  }

  private distributionByArea(totalAmount: number): void {
    this.units.forEach((unit) => {
      const percentage = (unit.area / this.totalArea) * 100;
      const amount = (totalAmount * unit.area) / this.totalArea;
      const ownerName = unit.owners.length > 0 ? `${unit.owners[0].firstName} ${unit.owners[0].lastName}` : 'Non assigné';
      this.distributionPreview.push({
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        ownerId: unit.owners[0]?.id ?? this.resolveOwnerId(ownerName),
        ownerName,
        area: unit.area,
        shares: unit.shares,
        amount: Math.round(amount * 100) / 100,
        percentage: Math.round(percentage * 100) / 100,
      });
    });
  }

  private distributionEqual(totalAmount: number): void {
    const amount = totalAmount / this.units.length;
    const percentage = 100 / this.units.length;
    this.units.forEach((unit) => {
      const ownerName = unit.owners.length > 0 ? `${unit.owners[0].firstName} ${unit.owners[0].lastName}` : 'Non assigné';
      this.distributionPreview.push({
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        ownerId: unit.owners[0]?.id ?? this.resolveOwnerId(ownerName),
        ownerName,
        area: unit.area,
        shares: unit.shares,
        amount: Math.round(amount * 100) / 100,
        percentage: Math.round(percentage * 100) / 100,
      });
    });
  }

  private initializeCustomDistribution(totalAmount: number): void {
    this.units.forEach((unit) => {
      const ownerName = unit.owners.length > 0 ? `${unit.owners[0].firstName} ${unit.owners[0].lastName}` : 'Non assigné';
      this.distributionPreview.push({
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        ownerId: unit.owners[0]?.id ?? this.resolveOwnerId(ownerName),
        ownerName,
        area: unit.area,
        shares: unit.shares,
        amount: 0,
        percentage: 0,
      });
    });
  }

  updateCustomAmount(index: number, amount: number): void {
    if (this.distributionPreview[index]) {
      this.distributionPreview[index].amount = amount;
      this.recalculatePercentages();
    }
  }

  private recalculatePercentages(): void {
    const total = this.distributionPreview.reduce((sum, item) => sum + item.amount, 0);
    this.distributionPreview.forEach((item) => {
      item.percentage = total > 0 ? (item.amount / total) * 100 : 0;
    });
  }

  getTotalDistributedAmount(): number {
    return this.distributionPreview.reduce((sum, item) => sum + item.amount, 0);
  }

  saveDistribution(): void {
    if (!this.repartitionForm.valid || this.distributionPreview.length === 0) return;

    this.saving.set(true);
    const copropertyId = this.repartitionForm.get('copropertyId')?.value;
    const year = this.repartitionForm.get('year')?.value;
    const baseDescription = this.repartitionForm.get('description')?.value || `Appel de fonds - Répartition ${year}`;
    const dueDate = new Date(`${year}-12-31T00:00:00`) as any;

    // Step 1: Persist ChargeDistributions for each selected charge
    const filteredCharges = this.getFilteredCharges().filter((c) => !!c.id);
    const distributeRequests = filteredCharges.map((charge) =>
      this.chargeService.calculateDistribution(charge.id!).pipe(
        catchError((err) => {
          console.error(`Error distributing charge ${charge.name}:`, err);
          return of([]);
        })
      )
    );

    // Step 2: After ChargeDistributions are persisted, create FundCalls
    forkJoin(distributeRequests.length > 0 ? distributeRequests : [of([])])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.createFundCallsAfterDistribution(copropertyId, baseDescription, dueDate);
      });
  }

  private createFundCallsAfterDistribution(copropertyId: string, baseDescription: string, dueDate: any): void {
    // Query existing unpaid fund call totals per owner to avoid double-charging
    this.fundCallService.getExistingFundCallTotals(copropertyId).pipe(
      catchError(() => of([] as { ownerId: string; remainingAmount: number }[])),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((existingTotals) => {
      const existingByOwner = new Map<string, number>();
      existingTotals.forEach(t => existingByOwner.set(t.ownerId, t.remainingAmount));

      const fundCallEntries: { input: CreateFundCallInput; preview: DistributionPreview }[] = [];
      const skipped: string[] = [];

      this.distributionPreview.forEach((p) => {
        const existing = existingByOwner.get(p.ownerId ?? '') || 0;
        const adjustedAmount = Math.max(0, p.amount - existing);

        if (adjustedAmount <= 0) {
          skipped.push(p.ownerName);
          return;
        }

        fundCallEntries.push({
          input: {
            copropertyId,
            ownerId: p.ownerId ?? undefined,
            amount: adjustedAmount,
            dueDate,
            description: `${baseDescription} - ${p.ownerName} (Lot ${p.unitNumber})`,
            status: 'TO_PAY' as const,
          },
          preview: p,
        });
      });

      if (skipped.length > 0) {
        this.toastService.show(
          `${skipped.length} propriétaire(s) non facturé(s) (appels existants couvrent le montant): ${skipped.join(', ')}`,
          { classname: 'bg-info text-white', delay: 5000 }
        );
      }

      if (fundCallEntries.length === 0) {
        this.saving.set(false);
        this.toastService.show(
          'Aucun nouvel appel de fonds à créer — les appels existants couvrent tous les montants.',
          { classname: 'bg-warning text-dark', delay: 5000 }
        );
        return;
      }

      const createRequests = fundCallEntries.map(({ input, preview }) =>
        this.fundCallService.createFundCall(input).pipe(
          catchError((err) => {
            const msg: string = err?.graphQLErrors?.[0]?.message ?? err?.message ?? '';
            return of({ __error: msg, __preview: preview } as any);
          })
        )
      );

      forkJoin(createRequests)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((results: any[]) => {
          const errors = results.filter((r) => r?.__error).map((r) => r.__error as string);
          const created = results.filter((r) => !r?.__error);

          // For fund calls that have a paymentDate set, record an immediate payment
          const paymentRequests = created
            .map((fundCall, idx) => {
              const preview = fundCallEntries[idx]?.preview;
              if (preview?.paymentDate && preview.paymentAmount && preview.paymentAmount > 0) {
                const paymentInput: AddFundCallPaymentInput = {
                  amount: preview.paymentAmount,
                  paymentDate: new Date(preview.paymentDate),
                  justificatif: `Paiement initial - ${preview.ownerName}`,
                };
                return this.fundCallService.addFundCallPayment(fundCall.id, paymentInput).pipe(
                  catchError(() => of(null))
                );
              }
              return of(null);
            })
            .filter((req) => req !== null);

          if (paymentRequests.length > 0) {
            forkJoin(paymentRequests)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe();
          }

          this.saving.set(false);

          if (created.length > 0) {
            this.toastService.show(
              `${created.length} appel(s) de fonds créé(s) avec succès`,
              { classname: 'bg-success text-white', delay: 4000 }
            );
          }
          if (errors.length > 0) {
            const unique = [...new Set(errors)];
            unique.forEach((msg) =>
              this.toastService.show(msg, { classname: 'bg-danger text-white', delay: 6000 })
            );
          }
          if (created.length > 0) {
            this.saveSuccess.set(true);
            setTimeout(() => {
              this.saveSuccess.set(false);
              this.router.navigate(['/coproperty/syndic/fund-calls']);
            }, 2000);
          }
        });
    });
  }

  reset(): void {
    this.distributionPreview = [];
    this.showPreview = false;
  }
}
