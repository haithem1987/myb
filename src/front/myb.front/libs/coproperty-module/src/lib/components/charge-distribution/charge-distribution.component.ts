import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChargeService, ChargeExtended } from '../../services/charge.service';
import { CopropertyService } from '../../services/coproperty.service';
import { CurrencyService } from '../../services/currency.service';
import { FundCallService } from '../../services/fund-call.service';
import { OwnerService } from '../../services/owner.service';
import { UnitService } from '../../services/unit.service';
import { OwnerWithUnits } from '../../models/owner.model';
import { CreateFundCallInput } from '../../models/fund-call.model';
import { ActiveCopropertyService } from '../../services/active-coproperty.service';
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
  private translateService = inject(TranslateService);
  private activeCoproperty = inject(ActiveCopropertyService);

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

  // Computed total from budgets for the selected coproperty & year
  calculatedTotal = signal<number>(0);

  constructor() {
    const currentYear = new Date().getFullYear();
    this.repartitionForm = this.fb.group({
      copropertyId: ['', Validators.required],
      year: [currentYear.toString(), Validators.required],
      description: [''],
    });
    this.repartitionForm.get('copropertyId')?.disable({ emitEvent: false });
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
            this.onCopropertyChange(this.activeCoproperty.selectAvailable(data));
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
    this.activeCoproperty.setActive(copropertyId);
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
            const matchingOwner = this.findOwnerForUnit(u, owners);
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

  private normalizeEntityId(value: string | null | undefined): string {
    return (value ?? '').replace(/-/g, '').toLowerCase();
  }

  private getUnassignedOwnerLabel(): string {
    const translated = this.translateService.instant('coproperty.owner.noOwner');
    return translated && translated !== 'coproperty.owner.noOwner' ? translated : 'Non assigné';
  }

  private findOwnerForUnit(
    unit: { id?: string; unitNumber?: string },
    owners: OwnerWithUnits[]
  ): OwnerWithUnits | undefined {
    const normalizedUnitId = this.normalizeEntityId(unit.id);
    const normalizedUnitNumber = (unit.unitNumber ?? '').trim().toLowerCase();
    const selectedCopropertyId = this.repartitionForm.get('copropertyId')?.value as string | null;

    return owners.find((owner) =>
      owner.ownerUnits?.some((link) => {
        if (link.endDate) return false;

        const linkCopropertyId = link.unit?.copropertyId;
        if (selectedCopropertyId && linkCopropertyId && linkCopropertyId !== selectedCopropertyId) {
          return false;
        }

        const linkedUnitId = this.normalizeEntityId(link.unitId ?? link.unit?.id);
        if (normalizedUnitId && linkedUnitId && linkedUnitId === normalizedUnitId) {
          return true;
        }

        const linkedUnitNumber = (link.unit?.unitNumber ?? '').trim().toLowerCase();
        return !!normalizedUnitNumber
          && !!linkedUnitNumber
          && linkedUnitNumber === normalizedUnitNumber;
      })
    );
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

  get years(): number[] {
    const currentYear = new Date().getFullYear();
    const years = new Set<number>(
      Array.from({ length: 11 }, (_, index) => currentYear - index)
    );

    for (const charge of this.charges()) {
      const year = new Date(charge.startDate).getFullYear();
      if (Number.isInteger(year)) years.add(year);
    }

    return [...years].sort((a, b) => b - a);
  }

  get currencySymbol(): string {
    return this.currencyService.getSymbol(this.selectedCoproperty()?.currency);
  }

  formatAmount(amount: number): string {
    return this.currencyService.formatAmount(
      amount,
      this.selectedCoproperty()?.currency
    );
  }

  // Distribution calculation logic
  calculateTotals(): void {
    this.totalShares = this.units.reduce((sum, u) => sum + u.shares, 0);
    this.totalArea = this.units.reduce((sum, u) => sum + u.area, 0);
  }

  /** Units that have an assigned owner — only these are included in the distribution. */
  private get assignedUnits(): Unit[] {
    return this.units.filter(u => u.owners.length > 0);
  }

  calculateDistribution(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (!this.isSelectedCopropertyActive()) return;

    const totalAmount = this.calculatedTotal();
    const assigned = this.assignedUnits;
    const unassignedCount = this.units.length - assigned.length;

    if (!totalAmount || totalAmount <= 0 || this.units.length === 0) {
      this.toastService.show(
        !totalAmount || totalAmount <= 0
          ? this.translateService.instant('coproperty.distribution.noChargesToDistribute')
          : this.translateService.instant('coproperty.distribution.noUnitsAvailable'),
        { classname: 'bg-info text-white', delay: 4000 }
      );
      return;
    }

    if (assigned.length === 0) {
      this.toastService.show(
        this.translateService.instant('coproperty.distribution.noAssignedOwners'),
        { classname: 'bg-warning text-dark', delay: 5000 }
      );
      return;
    }

    if (unassignedCount > 0) {
      this.toastService.show(
        this.translateService.instant('coproperty.distribution.unassignedLotsSkipped', { count: unassignedCount }),
        { classname: 'bg-info text-white', delay: 5000 }
      );
    }

    this.calculateTotals();
    // Recalculate totals using only assigned units
    const assignedTotalShares = assigned.reduce((sum, u) => sum + u.shares, 0);
    const assignedTotalArea = assigned.reduce((sum, u) => sum + u.area, 0);

    if (this.selectedMethod === DistributionMethod.ByShares && assignedTotalShares <= 0) {
      this.toastService.show(
        this.translateService.instant('coproperty.distribution.noSharesForDistribution'),
        { classname: 'bg-warning text-dark', delay: 5000 }
      );
      return;
    }

    if (this.selectedMethod === DistributionMethod.ByArea && assignedTotalArea <= 0) {
      this.toastService.show(
        this.translateService.instant('coproperty.distribution.noAreaForDistribution'),
        { classname: 'bg-warning text-dark', delay: 5000 }
      );
      return;
    }

    this.distributionPreview = [];

    switch (this.selectedMethod) {
      case DistributionMethod.ByShares:
        this.distributionByShares(totalAmount, assigned, assignedTotalShares);
        break;
      case DistributionMethod.ByArea:
        this.distributionByArea(totalAmount, assigned, assignedTotalArea);
        break;
      case DistributionMethod.Equal:
        this.distributionEqual(totalAmount, assigned);
        break;
      case DistributionMethod.Custom:
        this.initializeCustomDistribution(totalAmount, assigned);
        break;
    }
    this.showPreview = true;
  }

  /** Resolve a real owner ID from loaded owners by matching display name */
  private resolveOwnerId(ownerName: string): string | undefined {
    if (!ownerName || ownerName === this.getUnassignedOwnerLabel()) return undefined;
    const match = this.loadedOwners().find(
      (o) => `${o.firstName} ${o.lastName}`.toLowerCase() === ownerName.toLowerCase()
    );
    return match?.id;
  }

  private distributionByShares(totalAmount: number, units: Unit[], totalShares: number): void {
    units.forEach((unit) => {
      const percentage = (unit.shares / totalShares) * 100;
      const amount = (totalAmount * unit.shares) / totalShares;
      const ownerName = `${unit.owners[0].firstName} ${unit.owners[0].lastName}`;
      this.distributionPreview.push({
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        ownerId: unit.owners[0].id ?? this.resolveOwnerId(ownerName),
        ownerName,
        area: unit.area,
        shares: unit.shares,
        amount: Math.round(amount * 100) / 100,
        percentage: Math.round(percentage * 100) / 100,
      });
    });
  }

  private distributionByArea(totalAmount: number, units: Unit[], totalArea: number): void {
    units.forEach((unit) => {
      const percentage = (unit.area / totalArea) * 100;
      const amount = (totalAmount * unit.area) / totalArea;
      const ownerName = `${unit.owners[0].firstName} ${unit.owners[0].lastName}`;
      this.distributionPreview.push({
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        ownerId: unit.owners[0].id ?? this.resolveOwnerId(ownerName),
        ownerName,
        area: unit.area,
        shares: unit.shares,
        amount: Math.round(amount * 100) / 100,
        percentage: Math.round(percentage * 100) / 100,
      });
    });
  }

  private distributionEqual(totalAmount: number, units: Unit[]): void {
    const amount = totalAmount / units.length;
    const percentage = 100 / units.length;
    units.forEach((unit) => {
      const ownerName = `${unit.owners[0].firstName} ${unit.owners[0].lastName}`;
      this.distributionPreview.push({
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        ownerId: unit.owners[0].id ?? this.resolveOwnerId(ownerName),
        ownerName,
        area: unit.area,
        shares: unit.shares,
        amount: Math.round(amount * 100) / 100,
        percentage: Math.round(percentage * 100) / 100,
      });
    });
  }

  private initializeCustomDistribution(totalAmount: number, units: Unit[]): void {
    units.forEach((unit) => {
      const ownerName = `${unit.owners[0].firstName} ${unit.owners[0].lastName}`;
      this.distributionPreview.push({
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        ownerId: unit.owners[0].id ?? this.resolveOwnerId(ownerName),
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
    if (this.selectedCoproperty()?.isActive === false) return;
    if (!this.repartitionForm.valid || this.distributionPreview.length === 0) return;

    this.saving.set(true);
    const copropertyId = this.repartitionForm.get('copropertyId')?.value;
    const year = this.repartitionForm.get('year')?.value;
    const baseDescription = this.repartitionForm.get('description')?.value || `Appel de fonds - Répartition ${year}`;
    const dueDate = new Date(`${year}-12-31T00:00:00`) as any;

    const chargeIds = this.getFilteredCharges()
      .map((charge) => charge.id)
      .filter((id): id is string => !!id);
    this.createFundCallsAfterDistribution(copropertyId, chargeIds, baseDescription, dueDate);
  }

  isSelectedCopropertyActive(): boolean {
    return this.selectedCoproperty()?.isActive === true;
  }

  private createFundCallsAfterDistribution(
    copropertyId: string,
    chargeIds: string[],
    baseDescription: string,
    dueDate: Date
  ): void {
    // Query existing unpaid fund call totals per owner to avoid double-charging
    this.fundCallService.getExistingFundCallTotals(copropertyId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (existingTotals) => {
        const existingByOwner = new Map<string, number>();
        existingTotals.forEach(t =>
          existingByOwner.set(this.normalizeEntityId(t.ownerId), t.remainingAmount)
        );

        const fundCalls: CreateFundCallInput[] = [];
        const skipped: string[] = [];

        this.distributionPreview.forEach((p) => {
          const existing = existingByOwner.get(this.normalizeEntityId(p.ownerId)) || 0;
          const adjustedAmount = Math.max(0, p.amount - existing);

          if (adjustedAmount <= 0) {
            skipped.push(p.ownerName);
            return;
          }

          fundCalls.push({
            copropertyId,
            ownerId: p.ownerId ?? undefined,
            amount: adjustedAmount,
            dueDate,
            description: `${baseDescription} - ${p.ownerName} (Lot ${p.unitNumber})`,
            status: 'TO_PAY' as const,
          });
        });

        if (skipped.length > 0) {
          this.toastService.show(
            `${skipped.length} propriétaire(s) non facturé(s) (appels existants couvrent le montant): ${skipped.join(', ')}`,
            { classname: 'bg-info text-white', delay: 5000 }
          );
        }

        if (fundCalls.length === 0) {
          this.saving.set(false);
          this.toastService.show(
            'Aucun nouvel appel de fonds à créer — les appels existants couvrent tous les montants.',
            { classname: 'bg-warning text-dark', delay: 5000 }
          );
          return;
        }

        this.chargeService.createDistribution({ copropertyId, chargeIds, fundCalls })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (created) => {
              this.saving.set(false);
              this.toastService.show(
                this.translationOrFallback(
                  'coproperty.distribution.createSuccess',
                  `${created.length} appel(s) de fonds créé(s) avec succès`,
                  { count: created.length }
                ),
                { classname: 'bg-success text-white', delay: 4000 }
              );
              this.saveSuccess.set(true);
              setTimeout(() => {
                this.saveSuccess.set(false);
                this.router.navigate(['/coproperty/syndic/fund-calls']);
              }, 2000);
            },
            error: () => {
              this.saving.set(false);
              this.toastService.show(
                this.translationOrFallback(
                  'coproperty.distribution.createError',
                  'La création de la répartition a échoué. Aucune donnée partielle n\'a été enregistrée. Veuillez réessayer.'
                ),
                { classname: 'bg-danger text-white', delay: 7000 }
              );
            }
          });
      },
      error: () => {
        this.saving.set(false);
        this.toastService.show(
          'Impossible de vérifier les appels de fonds existants. Aucune distribution n\'a été créée.',
          { classname: 'bg-danger text-white', delay: 7000 }
        );
      }
    });
  }

  reset(): void {
    this.distributionPreview = [];
    this.showPreview = false;
  }

  private translationOrFallback(key: string, fallback: string, params?: Record<string, unknown>): string {
    const translated = this.translateService.instant(key, params);
    return translated && translated !== key ? translated : fallback;
  }
}
