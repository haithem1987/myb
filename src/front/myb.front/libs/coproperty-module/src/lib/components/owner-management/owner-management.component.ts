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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of, from, Subject } from 'rxjs';
import { map, finalize, switchMap, debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';

interface Unit {
  id: string;
  unitNumber: string;
  copropertyId?: string;
  copropertyName?: string;
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
  private destroyRef = inject(DestroyRef);
  private translateService = inject(TranslateService);
  
  owners: Owner[] = [];
  availableUnits: Unit[] = [];
  allUnits: Unit[] = [];
  coproperties = signal<Array<{id: string, name: string}>>([]);
  selectedCopropertyForFilter = signal<string>('');
  displayedColumns: string[] = ['name', 'email', 'phone', 'units', 'role', 'actions'];
  searchTerm: string = '';
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
    // Load coproperty first if copropertyId is provided, otherwise load all owners
    if (this.copropertyId) {
      this.loadOwners();
    } else {
      // Try to get first coproperty from the list
      this.copropertyService.getCoproperties()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (coproperties) => {
            if (coproperties.length > 0) {
              this.copropertyId = coproperties[0].id;
              this.loadOwners();
            }
          }
        });
    }
    this.loadAvailableUnits();
  }

  loadAvailableUnits(): void {
    this.loading.set(true);
    console.log('[Owner Management] Loading units started');
    
    // Load all units at once using the new getAllUnits query
    this.unitService.getAllUnits().pipe(
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
          copropertyName: u.copropertyName || 'Unknown'
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
    if (!this.unitSearchTerm.trim()) return this.availableUnits;
    const term = this.unitSearchTerm.toLowerCase();
    return this.availableUnits.filter(u =>
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
    console.log('[Owner Management] Loading owners for coproperty:', this.copropertyId);
    
    this.ownerService.getAllOwners(this.copropertyId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: async (owners) => {
          console.log('[Owner Management] Owners loaded:', owners.length);
          this.owners = owners.map(o => ({
            id: o.id,
            userId: o.userId,
            firstName: o.firstName,
            lastName: o.lastName,
            email: o.email,
            phone: o.phone || '',
            hasOwnerRole: false,
            ownerUnits: o.ownerUnits || []
          }));

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
    if (!this.searchTerm) {
      return this.owners;
    }
    const term = this.searchTerm.toLowerCase();
    return this.owners.filter(
      (owner) =>
        owner.firstName.toLowerCase().includes(term) ||
        owner.lastName.toLowerCase().includes(term) ||
        owner.email.toLowerCase().includes(term)
    );
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
    
    const selectedUnitIds = owner.ownerUnits?.map(ou => ou.unitId) || [];
    
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
      selectedUnits: selectedUnitIds,
    });
  }

  deleteOwner(owner: Owner): void {
    this.translateService.get('coproperty.owner.deleteConfirm').subscribe((confirmMsg) => {
      if (confirm(confirmMsg)) {
        this.loading.set(true);
        this.ownerService.deleteOwner(owner.id, this.copropertyId)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.loading.set(false))
          )
          .subscribe({
            next: (success) => {
              if (success) {
                // Remove from local list immediately for better UX
                this.owners = this.owners.filter((o) => o.id !== owner.id);
                this.translateService.get('coproperty.messages.deleted').subscribe((msg) => {
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
    });
  }

  saveOwner(): void {
    const formValue = this.ownerForm.getRawValue(); // getRawValue to include disabled fields
    const selectedUnitIds: string[] = formValue.selectedUnits || [];
    
    // Validate that at least one unit is selected
    if (selectedUnitIds.length === 0) {
      this.translateService.get('coproperty.owner.unitRequired').subscribe((msg) => {
        this.showAlert('warning', msg || 'Veuillez sélectionner au moins une unité');
      });
      return;
    }

    // For new owners, a Keycloak user must be selected
    if (!this.editingOwnerId && !this.selectedKeycloakUser()) {
      this.showAlert('warning', 'Veuillez sélectionner un utilisateur inscrit');
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
          ? this.ownerService.updateOwner(this.editingOwnerId, input, this.copropertyId)
          : this.ownerService.createOwner(input, this.copropertyId);
      }),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (owner) => {
        console.log('[Owner Management] Owner saved:', owner);
        const messageKey = this.editingOwnerId ? 'coproperty.messages.updated' : 'coproperty.messages.created';
        this.translateService.get(messageKey).subscribe((msg) => {
          this.showAlert('success', msg);
        });
        
        // Reload the owners list to get fresh data
        this.loadOwners();
        
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
    
    this.assigningRole.set(owner.userId);
    try {
      if (owner.hasOwnerRole) {
        await this.keycloakService.unassignRoleFromUser(owner.userId, 'coproperty-owner');
        // Remove the owner record from this coproperty so the user is no longer linked to this syndic
        await new Promise<void>((resolve, reject) => {
          this.ownerService.deleteOwner(owner.id, this.copropertyId).subscribe({
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
      return owner.ownerUnits.map(ou => ou.unit?.unitNumber || 'Unknown').join(', ');
    }
    return 'No units';
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

  private showAlert(type: 'success' | 'danger' | 'warning' | 'info', message: string) {
    this.alert.set({type, message});
    setTimeout(() => this.alert.set({type: null, message: ''}), 5000);
  }
}
