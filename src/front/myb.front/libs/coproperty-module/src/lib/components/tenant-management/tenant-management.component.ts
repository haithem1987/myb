import { dateRangeValidator } from '../../utils/date-range.validator';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { CopropertyService } from '../../services/coproperty.service';
import { TenantService } from '../../services/tenant.service';
import { UnitExtended, UnitService } from '../../services/unit.service';
import { Tenant, TenantInput } from '../../models/tenant.model';
import { KeycloakService } from '@myb-front/auth';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CurrencyService } from '../../services/currency.service';

@Component({
  selector: 'myb-tenant-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './tenant-management.component.html',
  styleUrls: ['./tenant-management.component.scss'],
})
export class TenantManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private copropertyService = inject(CopropertyService);
  private tenantService = inject(TenantService);
  private unitService = inject(UnitService);
  private keycloakService = inject(KeycloakService);
  private translate = inject(TranslateService);
  private currencyService = inject(CurrencyService);

  tenants: Tenant[] = [];
  units: UnitExtended[] = [];
  coproperties = signal<Array<{ id: string; name: string; isActive: boolean }>>([]);
  loading = signal(false);
  saving = signal(false);
  alert = signal<{ type: 'success' | 'danger' | 'info' | null; message: string }>({ type: null, message: '' });

  selectedCopropertyId = '';
  searchTerm = '';
  showForm = false;
  editingTenantId: string | null = null;

  tenantForm: FormGroup = this.fb.group({
    unitId: ['', Validators.required],
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    phone: ['', Validators.maxLength(50)],
    leaseStartDate: [this.today(), Validators.required],
    leaseEndDate: [''],
    monthlyRent: [null, [Validators.min(0)]],
    depositAmount: [null, [Validators.min(0)]],
    isActive: [true],
    notes: ['', Validators.maxLength(2000)],
  }, { validators: dateRangeValidator('leaseStartDate', 'leaseEndDate') });

  ngOnInit(): void {
    this.loadCoproperties();
  }

  get filteredTenants(): Tenant[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.tenants;
    }

    return this.tenants.filter((tenant) =>
      `${tenant.firstName} ${tenant.lastName}`.toLowerCase().includes(term) ||
      tenant.email.toLowerCase().includes(term) ||
      (tenant.phone || '').toLowerCase().includes(term) ||
      (tenant.unit?.unitNumber || '').toLowerCase().includes(term)
    );
  }

  get availableUnits(): UnitExtended[] {
    const editingTenant = this.editingTenantId ? this.tenants.find(t => t.id === this.editingTenantId) : null;
    return this.units.filter((unit) => {
      const activeTenant = this.tenants.find(t => t.unitId === unit.id && t.isActive);
      return !activeTenant || activeTenant.id === editingTenant?.id;
    });
  }

  loadCoproperties(): void {
    this.loading.set(true);
    const managerId = this.keycloakService.getSyndicManagerId();
    this.copropertyService.getCoproperties(managerId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (coproperties) => {
          this.coproperties.set(coproperties.map(c => ({ id: c.id, name: c.name, isActive: c.isActive })));
          const firstActive = coproperties.find(c => c.isActive);
          if (!this.selectedCopropertyId && firstActive) {
            this.selectedCopropertyId = firstActive.id;
            this.loadData();
          }
        },
        error: () => this.showAlert('danger', this.t('tenantManagement.messages.loadCopropertiesError')),
      });
  }

  onCopropertyChange(): void {
    this.cancelForm();
    this.loadData();
  }

  loadData(): void {
    if (!this.selectedCopropertyId) {
      return;
    }

    this.loading.set(true);
    this.unitService.getUnitsByCoproperty(this.selectedCopropertyId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (units) => this.units = units,
        error: () => this.showAlert('danger', this.t('tenantManagement.messages.loadUnitsError')),
      });

    this.tenantService.getTenants(this.selectedCopropertyId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (tenants) => this.tenants = tenants,
        error: () => this.showAlert('danger', this.t('tenantManagement.messages.loadTenantsError')),
      });
  }

  openAddForm(): void {
    if (!this.isSelectedCopropertyActive()) return;
    this.editingTenantId = null;
    this.showForm = true;
    this.tenantForm.reset({
      unitId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      leaseStartDate: this.today(),
      leaseEndDate: '',
      monthlyRent: null,
      depositAmount: null,
      isActive: true,
      notes: '',
    });
  }

  editTenant(tenant: Tenant): void {
    this.editingTenantId = tenant.id;
    // Populate immediately from the list row. The detail request below refreshes
    // the values, but a slow or unavailable request must never show an empty form.
    this.showForm = true;
    this.populateTenantForm(tenant);
    this.loading.set(true);
    this.tenantService.getTenantById(tenant.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (tenantDetails) => {
          this.populateTenantForm(tenantDetails);
        },
        error: () => {
          this.showAlert('info', this.t('tenantManagement.messages.loadTenantError'));
        },
      });
  }

  saveTenant(): void {
    if (!this.editingTenantId && !this.isSelectedCopropertyActive()) return;
    if (this.tenantForm.invalid || !this.selectedCopropertyId) {
      this.tenantForm.markAllAsTouched();
      return;
    }

    const input = this.toTenantInput();
    this.saving.set(true);

    const request = this.editingTenantId
      ? this.tenantService.updateTenant(this.editingTenantId, input, this.selectedCopropertyId)
      : this.tenantService.createTenant(input, this.selectedCopropertyId);

    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: () => {
          this.showAlert(
            'success',
            this.t(this.editingTenantId
              ? 'tenantManagement.messages.updated'
              : 'tenantManagement.messages.created')
          );
          this.cancelForm();
          this.loadData();
        },
        error: (error) => this.showAlert(
          'danger',
          error?.message || this.t('tenantManagement.messages.saveError')
        ),
      });
  }

  isSelectedCopropertyActive(): boolean {
    return this.coproperties().find(c => c.id === this.selectedCopropertyId)?.isActive === true;
  }

  deactivateTenant(tenant: Tenant): void {
    const input = this.toTenantInput(tenant, false);
    this.tenantService.updateTenant(tenant.id, input, this.selectedCopropertyId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showAlert('success', this.t('tenantManagement.messages.deactivated'));
          this.loadData();
        },
        error: () => this.showAlert('danger', this.t('tenantManagement.messages.deactivateError')),
      });
  }

  removeTenant(tenant: Tenant): void {
    if (!confirm(this.t('tenantManagement.messages.deleteConfirm', {
      name: `${tenant.firstName} ${tenant.lastName}`,
    }))) {
      return;
    }

    this.tenantService.removeTenant(tenant.id, this.selectedCopropertyId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showAlert('success', this.t('tenantManagement.messages.deleted'));
          this.loadData();
        },
        error: () => this.showAlert('danger', this.t('tenantManagement.messages.deleteError')),
      });
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingTenantId = null;
    this.tenantForm.reset();
  }

  unitLabel(unitId: string): string {
    const unit = this.units.find(u => u.id === unitId);
    return unit
      ? `${unit.unitNumber}${unit.floor != null ? ` - ${this.t('tenantManagement.floor', { floor: unit.floor })}` : ''}`
      : '-';
  }

  formatCurrency(value?: number | null): string {
    if (value == null) {
      return '-';
    }
    return this.currencyService.formatAmount(value);
  }

  private populateTenantForm(tenant: Tenant): void {
    this.tenantForm.reset({
      unitId: tenant.unitId,
      firstName: tenant.firstName,
      lastName: tenant.lastName,
      email: tenant.email,
      phone: tenant.phone || '',
      leaseStartDate: this.toDateInput(tenant.leaseStartDate),
      leaseEndDate: tenant.leaseEndDate ? this.toDateInput(tenant.leaseEndDate) : '',
      monthlyRent: tenant.monthlyRent ?? null,
      depositAmount: tenant.depositAmount ?? null,
      isActive: tenant.isActive,
      notes: tenant.notes || '',
    });
  }

  private toTenantInput(source?: Tenant, activeOverride?: boolean): TenantInput {
    const value = source ? {
      unitId: source.unitId,
      firstName: source.firstName,
      lastName: source.lastName,
      email: source.email,
      phone: source.phone || '',
      leaseStartDate: this.toDateInput(source.leaseStartDate),
      leaseEndDate: source.leaseEndDate ? this.toDateInput(source.leaseEndDate) : '',
      monthlyRent: source.monthlyRent ?? null,
      depositAmount: source.depositAmount ?? null,
      isActive: source.isActive,
      notes: source.notes || '',
    } : this.tenantForm.getRawValue();

    return {
      unitId: value.unitId,
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      phone: value.phone || null,
      leaseStartDate: new Date(value.leaseStartDate).toISOString(),
      leaseEndDate: value.leaseEndDate ? new Date(value.leaseEndDate).toISOString() : null,
      monthlyRent: value.monthlyRent === '' ? null : value.monthlyRent,
      depositAmount: value.depositAmount === '' ? null : value.depositAmount,
      isActive: activeOverride ?? value.isActive,
      notes: value.notes || null,
    };
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private toDateInput(value: string | Date): string {
    return new Date(value).toISOString().slice(0, 10);
  }

  private showAlert(type: 'success' | 'danger' | 'info', message: string): void {
    this.alert.set({ type, message });
    setTimeout(() => this.alert.set({ type: null, message: '' }), 5000);
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }
}
