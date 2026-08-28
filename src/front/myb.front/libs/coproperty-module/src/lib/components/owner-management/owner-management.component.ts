import { Component, OnInit, Input, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CreateOwnerWithUnitsInput, OwnerUnitInput, OwnerWithUnits } from '../../models/owner.model';
import { UnitService, UnitExtended } from '../../services/unit.service';
import { CopropertyService } from '../../services/coproperty.service';
import { OwnerService } from '../../services/owner.service';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { ModalService } from '@myb-front/shared-ui';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of, from, Subject, forkJoin } from 'rxjs';
import { map, finalize, switchMap, debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';

interface Unit {
  id: string;
  unitNumber: string;
  copropertyId?: string;
  copropertyName?: string;
  ownerUnits?: Array<{
    ownerId: string;
    endDate?: Date | null;
  }>;
}

interface Owner {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hasOwnerRole?: boolean;
  ownerUnits?: Array<{
    id: string;
    unitId: string;
    ownershipPercentage: number;
    isMainOwner: boolean;
    startDate?: Date;
    endDate?: Date | null;
    unit?: Unit;
  }>;
  units?: Unit[]; // For backward compatibility
}

interface KeycloakUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  emailVerified: boolean;
  roles: string[];
}

@Component({
  selector: 'myb-owner-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, NgbDropdownModule],
  templateUrl: './owner-management.component.html',
  styleUrls: ['./owner-management.component.scss'],
})
export class OwnerManagementComponent implements OnInit {
  @Input() copropertyId?: string;
  
  private fb = inject(FormBuilder);
  private unitService = inject(UnitService);
  private copropertyService = inject(CopropertyService);
  private ownerService = inject(OwnerService);
  private keycloakService = inject(KeycloakService);
  private modalService = inject(ModalService);
  private destroyRef = inject(DestroyRef);
  private translateService = inject(TranslateService);

  private static readonly ACTIVE_COPROPERTY_STORAGE_KEY = 'activeCopropertyId';
  
  owners: Owner[] = [];
  availableUnits: Unit[] = [];
  allUnits: Unit[] = [];
  coproperties = signal<Array<{id: string, name: string}>>([]);
  selectedCopropertyForFilter = signal<string>('');
  displayedColumns: string[] = ['name', 'email', 'phone', 'units', 'role', 'actions'];
  searchTerm: string = '';
  ownerUnitFilter: string = '';
  unitSearchTerm: string = '';
  showAddForm: boolean = false;
  ownerForm: FormGroup;
  editingOwnerId: string | null = null;
  loading = signal<boolean>(false);
  alert = signal<{type: 'success' | 'danger' | 'warning' | 'info' | null, message: string}>({type: null, message: ''});

  // ── Keycloak user search ──
  keycloakSearchTerm: string = '';
  keycloakSearchResults = signal<KeycloakUser[]>([]);
  keycloakSearchLoading = signal<boolean>(false);
  selectedKeycloakUser = signal<KeycloakUser | null>(null);
  private keycloakSearch$ = new Subject<string>();

  // ── Role assignment state ──
  assigningRole = signal<string | null>(null); // userId being assigned
  ownershipTransfer = signal<{ unitId: string; unitNumber: string; currentOwnerId: string; currentOwnerName: string } | null>(null);
  transferNewOwnerId = signal<string>('');

  constructor() {
    this.ownerForm = this.fb.group({
      firstName: [{ value: '', disabled: true }],
      lastName: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      phone: [''],
      selectedUnits: [<string[]>[], Validators.required],
    });

    // Debounced Keycloak user search
    this.keycloakSearch$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      filter(term => term.length >= 2),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(term => {
      this.searchKeycloakUsers(term);
    });
  }

  ngOnInit(): void {
    // Keep an explicitly supplied coproperty scope (embedded usage). The owners
    // screen itself defaults to the aggregate "all coproperties" view.
    if (this.copropertyId) {
      this.loadOwners();
      this.loadAvailableUnits();
    } else {
      const managerId = this.keycloakService.getSyndicManagerId();
      this.copropertyService.getCoproperties(managerId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (coproperties) => {
            this.coproperties.set(coproperties.map((c) => ({ id: c.id, name: c.name })));

            if (coproperties.length > 0) {
              this.copropertyId = 'all';
              this.selectedCopropertyForFilter.set(this.copropertyId);
              localStorage.setItem(OwnerManagementComponent.ACTIVE_COPROPERTY_STORAGE_KEY, this.copropertyId);
              this.loadOwners();
              this.loadAvailableUnits();
            }
          }
        });
    }
  }

  onCopropertySelectionChange(copropertyId: string): void {
    if (!copropertyId || copropertyId === this.copropertyId) {
      return;
    }

    this.copropertyId = copropertyId;
    this.selectedCopropertyForFilter.set(copropertyId);
    localStorage.setItem(OwnerManagementComponent.ACTIVE_COPROPERTY_STORAGE_KEY, copropertyId);

    this.searchTerm = '';
    this.ownerUnitFilter = '';
    this.showAddForm = false;
    this.editingOwnerId = null;
    this.owners = [];

    this.loadOwners();
    this.loadAvailableUnits();
  }

  loadAvailableUnits(): void {
    this.loading.set(true);
    console.log('[Owner Management] Loading syndic units started');
    
    // A syndic can assign any available lot from any coproperty they manage.
    // Active ownership links are returned with the units so already assigned
    // lots can be excluded before the form reaches the backend validation.
    const managerId = this.keycloakService.getSyndicManagerId();
    this.unitService.getAllUnitsBySyndic(managerId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        console.log('[Owner Management] Loading units finalized');
        this.loading.set(false);
      })
    ).subscribe({
      next: (units) => {
        console.log('[Owner Management] Units loaded:', units.length);
        // Transform units for display
        this.allUnits = units.map(u => ({
          id: u.id!,
          unitNumber: u.unitNumber,
          copropertyId: u.copropertyId,
          copropertyName: u.copropertyName || this.translateService.instant('common.unknown'),
          ownerUnits: u.ownerUnits
        }));
        this.availableUnits = [...this.allUnits];
        this.unitSearchTerm = '';
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[Owner Management] Error loading units:', err);
        this.translateService.get('coproperty.messages.error').subscribe(msg => {
          this.showAlert('danger', msg);
        });
        this.loading.set(false);
      }
    });
  }

  get filteredAvailableUnits(): Unit[] {
    // Fallback to the loaded owner list for older API deployments that do not
    // yet return ownerUnits on allUnitsBySyndic.
    const activeOwnerByUnit = new Map<string, string>();
    this.owners.forEach(owner =>
      (owner.ownerUnits || [])
        .filter(link => !link.endDate)
        .forEach(link => activeOwnerByUnit.set(link.unitId, owner.id))
    );
    const selectable = this.availableUnits.filter(unit => {
      const assignedOwnerId = unit.ownerUnits?.find(link => !link.endDate)?.ownerId
        ?? activeOwnerByUnit.get(unit.id);
      return !assignedOwnerId || assignedOwnerId === this.editingOwnerId;
    });
    if (!this.unitSearchTerm.trim()) return selectable;
    const term = this.unitSearchTerm.toLowerCase();
    return selectable.filter(u =>
      u.unitNumber.toLowerCase().includes(term) ||
      (u.copropertyName || '').toLowerCase().includes(term)
    );
  }

  loadOwners(): void {
    if (!this.copropertyId) {
      console.warn('[Owner Management] No coproperty ID available');
      return;
    }

    this.loading.set(true);
    console.log('[Owner Management] Loading owners for coproperty scope:', this.copropertyId);

    const ownersRequest = this.copropertyId === 'all'
      ? (this.coproperties().length > 0
          ? forkJoin(this.coproperties().map(coproperty =>
              this.ownerService.getAllOwners(coproperty.id)
            )).pipe(map(ownerGroups => ownerGroups.flat()))
          : of([] as OwnerWithUnits[]))
      : this.ownerService.getAllOwners(this.copropertyId);

    ownersRequest
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: async (owners) => {
          console.log('[Owner Management] Owners loaded:', owners.length);
          // Legacy databases may contain duplicate Owner rows for the same
          // Keycloak user. Render one logical owner while the migration
          // reconciles those records permanently.
          const ownersByUser = new Map<string, Owner>();
          owners.forEach(o => {
            const key = o.userId || o.email.toLowerCase();
            const current = ownersByUser.get(key);
            const activeLinks = (o.ownerUnits || []).filter(link => {
              if (link.endDate) {
                return false;
              }

              const linkCopropertyId = link.unit?.copropertyId;
              return this.copropertyId === 'all'
                || !this.copropertyId
                || !linkCopropertyId
                || linkCopropertyId === this.copropertyId;
            });
            if (!current) {
              ownersByUser.set(key, {
                id: o.id,
                userId: o.userId,
                firstName: o.firstName,
                lastName: o.lastName,
                email: o.email,
                phone: o.phone || '',
                hasOwnerRole: false,
                ownerUnits: activeLinks
              });
              return;
            }

            const knownUnitIds = new Set((current.ownerUnits || []).map(link => link.unitId));
            current.ownerUnits = [
              ...(current.ownerUnits || []),
              ...activeLinks.filter(link => !knownUnitIds.has(link.unitId))
            ];
          });
          this.owners = Array.from(ownersByUser.values());

          // Enrich owners with Keycloak role status
          for (const owner of this.owners) {
            if (owner.userId) {
              try {
                const roles = await this.keycloakService.getUserClientRoles(owner.userId);
                owner.hasOwnerRole = roles.includes('coproperty-owner');
              } catch {
                owner.hasOwnerRole = false;
              }
            }
          }
        },
        error: (err) => {
          console.error('[Owner Management] Error loading owners:', err);
          this.translateService.get('coproperty.messages.error').subscribe(msg => {
            this.showAlert('danger', msg);
          });
        }
      });
  }

  get filteredOwners(): Owner[] {
    let filtered = this.owners;

    if (this.ownerUnitFilter) {
      filtered = filtered.filter(owner =>
        (owner.ownerUnits || []).some(link =>
          !link.endDate && link.unitId === this.ownerUnitFilter
        )
      );
    }

    const term = this.searchTerm.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter(owner =>
        owner.firstName.toLowerCase().includes(term) ||
        owner.lastName.toLowerCase().includes(term) ||
        owner.email.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  get ownerUnitFilterOptions(): Unit[] {
    const unitIds = new Set(
      this.owners.flatMap(owner =>
        (owner.ownerUnits || [])
          .filter(link => !link.endDate)
          .map(link => link.unitId)
      )
    );

    return this.allUnits
      .filter(unit => unitIds.has(unit.id))
      .sort((left, right) => {
        const copropertyComparison = (left.copropertyName || '')
          .localeCompare(right.copropertyName || '');
        return copropertyComparison || left.unitNumber.localeCompare(right.unitNumber);
      });
  }

  /** Apollo refetches require a real coproperty UUID, never `all`. */
  private get selectedCopropertyIdForRefetch(): string | undefined {
    return this.copropertyId && this.copropertyId !== 'all'
      ? this.copropertyId
      : undefined;
  }

  openAddForm(): void {
    this.showAddForm = true;
    this.editingOwnerId = null;
    this.ownerForm.reset();
    this.ownerForm.patchValue({ 
      selectedUnits: []
    });
    // Reset Keycloak search state
    this.keycloakSearchTerm = '';
    this.keycloakSearchResults.set([]);
    this.selectedKeycloakUser.set(null);
  }

  editOwner(owner: Owner): void {
    this.editingOwnerId = owner.id;
    this.showAddForm = true;
    
    // allUnits is authoritative here: it includes every active assignment for
    // every coproperty managed by this syndic. This prevents an assignment in
    // another coproperty from appearing unchecked and being removed by mistake.
    const selectedUnitIds = this.allUnits
      .filter(unit => unit.ownerUnits?.some(link => !link.endDate && link.ownerId === owner.id))
      .map(unit => unit.id);
    const fallbackSelectedUnitIds = owner.ownerUnits?.map(ou => ou.unitId) || [];
    
    // Set selected Keycloak user from owner data
    this.selectedKeycloakUser.set({
      id: owner.userId || '',
      email: owner.email,
      firstName: owner.firstName,
      lastName: owner.lastName,
      enabled: true,
      emailVerified: true,
      roles: owner.hasOwnerRole ? ['coproperty-owner'] : [],
    });
    
    this.ownerForm.patchValue({
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: owner.email,
      phone: owner.phone,
      selectedUnits: selectedUnitIds.length > 0 ? selectedUnitIds : fallbackSelectedUnitIds,
    });
  }

  async deleteOwner(owner: Owner): Promise<void> {
    const activeUnits = (owner.ownerUnits ?? [])
      .filter(ownerUnit => !ownerUnit.endDate)
      .map(ownerUnit => ownerUnit.unit?.unitNumber)
      .filter((unitNumber): unitNumber is string => !!unitNumber);
    const ownerName = this.escapeHtml(this.getOwnerFullName(owner));
    const unitSummary = activeUnits.length > 0
      ? `<br><br><strong>${this.translateService.instant('coproperty.owner.deleteAssignedUnits')}:</strong> ${activeUnits.map(unit => this.escapeHtml(unit)).join(', ')}`
      : '';

    const confirmed = await this.modalService.confirm({
      title: this.translateService.instant('coproperty.owner.deleteConfirmTitle'),
      message: `${this.translateService.instant('coproperty.owner.deleteConfirmMessage', { owner: ownerName })}${unitSummary}<br><br><span class="text-muted">${this.translateService.instant('coproperty.owner.deleteHistoryNotice')}</span>`,
      confirmButtonText: this.translateService.instant('common.deleteAction'),
      confirmButtonClass: 'btn-danger',
      cancelButtonText: this.translateService.instant('common.cancel')
    });
    if (!confirmed) return;

    this.loading.set(true);
    this.ownerService.deleteOwner(owner.id, this.selectedCopropertyIdForRefetch)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (success) => {
          if (success) {
            this.owners = this.owners.filter((item) => item.id !== owner.id);
            this.loadAvailableUnits();
            this.translateService.get('coproperty.messages.ownerDeleted').subscribe((msg) => {
              this.showAlert('success', msg);
            });
          }
        },
        error: (err) => {
          console.error('[Owner Management] Error deleting owner:', err);
          this.translateService.get('coproperty.messages.error').subscribe((msg) => {
            this.showAlert('danger', msg);
          });
        }
      });
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>'"]/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character] ?? character);
  }

  saveOwner(): void {
    const formValue = this.ownerForm.getRawValue(); // getRawValue to include disabled fields
    const selectedUnitIds: string[] = formValue.selectedUnits || [];
    
    // A new owner needs an initial unit. An existing owner may have every unit
    // unchecked, which cleanly unassigns those units while retaining history.
    if (!this.editingOwnerId && selectedUnitIds.length === 0) {
      this.translateService.get('coproperty.owner.unitRequired').subscribe((msg) => {
        this.showAlert('warning', msg || this.translateService.instant('validation.required'));
      });
      return;
    }

    // Accept only units returned in the authenticated syndic's managed scope.
    const validUnitIds = new Set(this.allUnits.map(unit => unit.id));
    const hasInvalidUnits = selectedUnitIds.some(unitId => !validUnitIds.has(unitId));
    if (hasInvalidUnits) {
      this.showAlert('warning', this.translateService.instant('coproperty.messages.error'));
      return;
    }

    // For new owners, a Keycloak user must be selected
    if (!this.editingOwnerId && !this.selectedKeycloakUser()) {
      this.showAlert('warning', this.translateService.instant('coproperty.owner.selectUserRequired'));
      return;
    }
    
    this.loading.set(true);

    const keycloakUser = this.selectedKeycloakUser();
    const keycloakUserId = this.editingOwnerId 
      ? (this.owners.find(o => o.id === this.editingOwnerId)?.userId || keycloakUser?.id || '')
      : keycloakUser!.id;

    // Step 1: Assign coproperty-owner role in Keycloak (if not already assigned)
    const assignRole$ = from(
      this.keycloakService.assignRoleToUser(keycloakUserId, 'coproperty-owner')
        .then(() => console.log('[Owner Management] coproperty-owner role assigned'))
        .catch(err => console.warn('[Owner Management] Could not assign role:', err))
    );

    assignRole$.pipe(
      switchMap(() => {
        // Step 2: Create/update the owner entity with unit links
        const input: CreateOwnerWithUnitsInput = {
          userId: keycloakUserId,
          firstName: formValue.firstName || keycloakUser?.firstName || '',
          lastName: formValue.lastName || keycloakUser?.lastName || '',
          email: formValue.email || keycloakUser?.email || '',
          phone: formValue.phone || '',
          units: selectedUnitIds.map(unitId => ({
            unitId: unitId,
            ownershipPercentage: 100,
            isMainOwner: true,
            startDate: new Date().toISOString(),
            endDate: null
          }))
        };
        
        return this.editingOwnerId 
          ? this.ownerService.updateOwner(this.editingOwnerId, input, this.selectedCopropertyIdForRefetch)
          : this.ownerService.createOwner(input, this.selectedCopropertyIdForRefetch);
      }),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (owner) => {
        console.log('[Owner Management] Owner saved:', owner);
        const messageKey = this.editingOwnerId ? 'coproperty.messages.ownerUpdated' : 'coproperty.messages.ownerCreated';
        this.translateService.get(messageKey).subscribe((msg) => {
          this.showAlert('success', msg);
        });
        
        // Reload the owners list to get fresh data
        this.loadOwners();
        this.loadAvailableUnits();
        
        // Reset form
        this.showAddForm = false;
        this.editingOwnerId = null;
        this.ownerForm.reset();
        this.selectedKeycloakUser.set(null);
        this.keycloakSearchResults.set([]);
        this.keycloakSearchTerm = '';
      },
      error: (err) => {
        console.error('[Owner Management] Error saving owner:', err);
        this.translateService.get('coproperty.messages.error').subscribe((msg) => {
          this.showAlert('danger', msg);
        });
      }
    });
  }

  /**
   * Search Keycloak for registered users by email.
   * Only shows users who are not already owners in this coproperty.
   */
  private async searchKeycloakUsers(email: string): Promise<void> {
    this.keycloakSearchLoading.set(true);
    try {
      const users = await this.keycloakService.searchKeycloakUsers(email);
      // Filter out users who are already owners
      const existingOwnerUserIds = new Set(this.owners.map(o => o.userId).filter(Boolean));
      const existingOwnerEmails = new Set(this.owners.map(o => o.email?.toLowerCase()).filter(Boolean));
      const filtered = users.filter(u =>
        !existingOwnerUserIds.has(u.id) && !existingOwnerEmails.has(u.email?.toLowerCase())
      );
      this.keycloakSearchResults.set(filtered);
    } catch (err) {
      console.error('[Owner Management] Keycloak search error:', err);
      this.keycloakSearchResults.set([]);
    } finally {
      this.keycloakSearchLoading.set(false);
    }
  }

  /**
   * Triggered when the syndic types in the Keycloak user search box
   */
  onKeycloakSearchInput(): void {
    this.keycloakSearch$.next(this.keycloakSearchTerm);
    if (this.keycloakSearchTerm.length < 2) {
      this.keycloakSearchResults.set([]);
    }
  }

  /**
   * Select a Keycloak user to create as owner
   */
  selectKeycloakUser(user: KeycloakUser): void {
    this.selectedKeycloakUser.set(user);
    this.keycloakSearchResults.set([]);
    this.keycloakSearchTerm = '';
    
    // Pre-fill form with Keycloak user data (read-only)
    this.ownerForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });
  }

  /**
   * Clear the selected Keycloak user
   */
  clearSelectedUser(): void {
    this.selectedKeycloakUser.set(null);
    this.ownerForm.patchValue({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    });
  }

  /**
   * Toggle coproperty-owner role on/off for an existing owner in the table
   */
  async toggleOwnerRole(owner: Owner): Promise<void> {
    if (!owner.userId) return;

    if (owner.hasOwnerRole) {
      const confirmed = await this.modalService.confirm({
        title: this.translateService.instant('coproperty.owner.removeRoleConfirmTitle'),
        message: `${this.translateService.instant('coproperty.owner.removeRoleConfirmMessage')}<br/><br/><strong>${owner.firstName} ${owner.lastName}</strong>`,
        confirmButtonText: this.translateService.instant('common.confirm'),
        confirmButtonClass: 'btn-danger',
        cancelButtonText: this.translateService.instant('common.cancel')
      });

      if (!confirmed) {
        return;
      }
    }
    
    this.assigningRole.set(owner.userId);
    try {
      if (owner.hasOwnerRole) {
        await this.keycloakService.unassignRoleFromUser(owner.userId, 'coproperty-owner');
        // Remove the owner record from this coproperty so the user is no longer linked to this syndic
        await new Promise<void>((resolve, reject) => {
          this.ownerService.deleteOwner(owner.id, this.selectedCopropertyIdForRefetch).subscribe({
            next: () => resolve(),
            error: reject
          });
        });
        this.owners = this.owners.filter(o => o.id !== owner.id);
        this.translateService.get('common.roleUnassigned').subscribe(msg => this.showAlert('info', msg));
      } else {
        await this.keycloakService.assignRoleToUser(owner.userId, 'coproperty-owner');
        owner.hasOwnerRole = true;
        this.translateService.get('common.roleAssigned').subscribe(msg => this.showAlert('success', msg));
      }
    } catch (err) {
      console.error('[Owner Management] Role toggle error:', err);
      this.translateService.get('coproperty.messages.error').subscribe(msg => this.showAlert('danger', msg));
    } finally {
      this.assigningRole.set(null);
    }
  }

  /**
   * Check if a Keycloak user has the coproperty-owner role
   */
  userHasOwnerRole(user: KeycloakUser): boolean {
    return user.roles.includes('coproperty-owner');
  }

  cancelForm(): void {
    this.showAddForm = false;
    this.editingOwnerId = null;
    this.ownerForm.reset();
    this.selectedKeycloakUser.set(null);
    this.keycloakSearchResults.set([]);
    this.keycloakSearchTerm = '';
  }

  getOwnerFullName(owner: Owner): string {
    return `${owner.firstName} ${owner.lastName}`;
  }
  
  getOwnerUnits(owner: Owner): string {
    if (owner.ownerUnits && owner.ownerUnits.length > 0) {
      return owner.ownerUnits.map(ou => ou.unit?.unitNumber || this.translateService.instant('common.unknown')).join(', ');
    }
    return this.translateService.instant('coproperty.unit.noUnitsAvailable');
  }
  
  isUnitSelected(unitId: string): boolean {
    const selectedUnits = this.ownerForm.get('selectedUnits')?.value || [];
    return selectedUnits.includes(unitId);
  }
  
  toggleUnitSelection(unitId: string): void {
    const selectedUnits = this.ownerForm.get('selectedUnits')?.value || [];
    const index = selectedUnits.indexOf(unitId);
    
    if (index > -1) {
      selectedUnits.splice(index, 1);
    } else {
      selectedUnits.push(unitId);
    }
    
    this.ownerForm.patchValue({ selectedUnits: [...selectedUnits] });
  }

  openOwnershipTransfer(owner: Owner, ownerUnit: NonNullable<Owner['ownerUnits']>[number]): void {
    if (!ownerUnit.unit) return;
    this.transferNewOwnerId.set('');
    this.ownershipTransfer.set({
      unitId: ownerUnit.unitId,
      unitNumber: ownerUnit.unit.unitNumber,
      currentOwnerId: owner.id,
      currentOwnerName: this.getOwnerFullName(owner)
    });
  }

  cancelOwnershipTransfer(): void {
    this.ownershipTransfer.set(null);
    this.transferNewOwnerId.set('');
  }

  get transferOwnerOptions(): Owner[] {
    const transfer = this.ownershipTransfer();
    return transfer ? this.owners.filter(owner => owner.id !== transfer.currentOwnerId) : [];
  }

  async confirmOwnershipTransfer(): Promise<void> {
    const transfer = this.ownershipTransfer();
    const newOwner = this.owners.find(owner => owner.id === this.transferNewOwnerId());
    if (!transfer || !newOwner) return;

    const confirmed = await this.modalService.confirm({
      title: this.translateService.instant('coproperty.owner.confirmChangeTitle'),
      message: this.translateService.instant('coproperty.owner.confirmChangeMessage', {
        unit: transfer.unitNumber,
        previousOwner: transfer.currentOwnerName,
        newOwner: this.getOwnerFullName(newOwner)
      }),
      confirmButtonText: this.translateService.instant('coproperty.owner.changeOwner'),
      confirmButtonClass: 'btn-warning',
      cancelButtonText: this.translateService.instant('common.cancel')
    });
    if (!confirmed) return;

    this.loading.set(true);
    this.ownerService.changeUnitOwner(transfer.unitId, newOwner.id, this.selectedCopropertyIdForRefetch)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: () => {
          this.cancelOwnershipTransfer();
          this.showAlert('success', this.translateService.instant('coproperty.owner.changeSuccess', {
            unit: transfer.unitNumber
          }));
          this.loadOwners();
        },
        error: (err) => {
          console.error('[Owner Management] Ownership transfer failed:', err);
          const message = err?.graphQLErrors?.[0]?.message ||
            this.translateService.instant('coproperty.owner.changeFailed');
          this.showAlert('danger', message);
        }
      });
  }

  private showAlert(type: 'success' | 'danger' | 'warning' | 'info', message: string) {
    this.alert.set({type, message});
    setTimeout(() => this.alert.set({type: null, message: ''}), 5000);
  }
}
