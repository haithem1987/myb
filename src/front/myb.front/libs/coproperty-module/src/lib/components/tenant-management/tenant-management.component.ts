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

@Component({
  selector: 'myb-tenant-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
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

  tenants: Tenant[] = [];
  units: UnitExtended[] = [];
  coproperties = signal<Array<{ id: string; name: string }>>([]);
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
  });

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
          this.coproperties.set(coproperties.map(c => ({ id: c.id, name: c.name })));
          if (!this.selectedCopropertyId && coproperties.length > 0) {
            this.selectedCopropertyId = coproperties[0].id;
            this.loadData();
          }
        },
        error: () => this.showAlert('danger', 'Impossible de charger les coproprietes.'),
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
        error: () => this.showAlert('danger', 'Impossible de charger les lots.'),
      });

    this.tenantService.getTenants(this.selectedCopropertyId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (tenants) => this.tenants = tenants,
        error: () => this.showAlert('danger', 'Impossible de charger les locataires.'),
      });
  }

  openAddForm(): void {
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
    this.showForm = true;
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

  saveTenant(): void {
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
          this.showAlert('success', this.editingTenantId ? 'Locataire mis a jour.' : 'Locataire ajoute.');
          this.cancelForm();
          this.loadData();
        },
        error: (error) => this.showAlert('danger', error?.message || 'Impossible d enregistrer le locataire.'),
      });
  }

  deactivateTenant(tenant: Tenant): void {
    const input = this.toTenantInput(tenant, false);
    this.tenantService.updateTenant(tenant.id, input, this.selectedCopropertyId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showAlert('success', 'Locataire desactive.');
          this.loadData();
        },
        error: () => this.showAlert('danger', 'Impossible de desactiver le locataire.'),
      });
  }

  removeTenant(tenant: Tenant): void {
    if (!confirm(`Supprimer ${tenant.firstName} ${tenant.lastName} ?`)) {
      return;
    }

    this.tenantService.removeTenant(tenant.id, this.selectedCopropertyId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showAlert('success', 'Locataire supprime.');
          this.loadData();
        },
        error: () => this.showAlert('danger', 'Impossible de supprimer le locataire.'),
      });
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingTenantId = null;
    this.tenantForm.reset();
  }

  unitLabel(unitId: string): string {
    const unit = this.units.find(u => u.id === unitId);
    return unit ? `${unit.unitNumber}${unit.floor != null ? ` - etage ${unit.floor}` : ''}` : '-';
  }

  formatCurrency(value?: number | null): string {
    if (value == null) {
      return '-';
    }
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
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
}
