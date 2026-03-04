import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChargeService, ChargeExtended } from '../../services/charge.service';
import { CopropertyService } from '../../services/coproperty.service';
import { FundCallService } from '../../services/fund-call.service';
import { OwnerService } from '../../services/owner.service';
import { UnitService } from '../../services/unit.service';
import { OwnerWithUnits } from '../../models/owner.model';
import { AddFundCallPaymentInput, CreateFundCallInput } from '../../models/fund-call.model';
import { Coproperty } from '../../models/coproperty.models';
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
  private fundCallService = inject(FundCallService);
  private ownerService = inject(OwnerService);
  private unitService = inject(UnitService);
  private fb = inject(FormBuilder);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private toastService = inject(ToastService);

  loadedOwners = signal<OwnerWithUnits[]>([]);

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
    this.copropertyService.getCoproperties()
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
      charges: this.chargeService.getChargesByCoproperty(copropertyId).pipe(take(1), catchError(() => of([]))),
      owners: this.ownerService.getAllOwners(copropertyId).pipe(take(1), catchError(() => of([]))),
      units: this.unitService.getUnitsByCoproperty(copropertyId).pipe(take(1), catchError(() => of([]))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ charges, owners, units }) => {
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

  private recalculateTotal(): void {
    const year = this.repartitionForm.get('year')?.value;
    const allCharges = this.charges();
    const filtered = allCharges.filter(c => c.frequency === year);
    const total = filtered.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
    this.calculatedTotal.set(total);
  }

  getFilteredCharges(): ChargeExtended[] {
    const year = this.repartitionForm.get('year')?.value;
    return this.charges().filter(c => c.frequency === year);
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Distribution calculation logic
  calculateTotals(): void {
    this.totalShares = this.units.reduce((sum, u) => sum + u.shares, 0);
    this.totalArea = this.units.reduce((sum, u) => sum + u.area, 0);
  }

  calculateDistribution(): void {
    const totalAmount = this.calculatedTotal();
    if (!totalAmount || totalAmount <= 0 || this.units.length === 0) return;

    this.calculateTotals();
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

    // One fund call per unit/owner entry (each row = one fund call)
    const fundCallEntries: { input: CreateFundCallInput; preview: DistributionPreview }[] =
      this.distributionPreview.map((p) => ({
        input: {
          copropertyId,
          ownerId: p.ownerId ?? undefined,
          amount: p.amount,
          dueDate,
          description: `${baseDescription} - ${p.ownerName} (Lot ${p.unitNumber})`,
          status: 'TO_PAY' as const,
        },
        preview: p,
      }));

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
  }

  reset(): void {
    this.distributionPreview = [];
    this.showPreview = false;
  }
}
