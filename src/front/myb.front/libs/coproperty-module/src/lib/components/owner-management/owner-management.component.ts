import { Component, OnInit, Input, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CreateOwnerWithUnitsInput, OwnerUnitInput, OwnerWithUnits } from '../../models/owner.model';
import { UnitService, UnitExtended } from '../../services/unit.service';
import { CopropertyService } from '../../services/coproperty.service';
import { OwnerService } from '../../services/owner.service';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of, from } from 'rxjs';
import { map, finalize, switchMap } from 'rxjs/operators';

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
  ownerUnits?: Array<{
    id: string;
    unitId: string;
    ownershipPercentage: number;
    isMainOwner: boolean;
    unit?: Unit;
  }>;
  units?: Unit[]; // For backward compatibility
}

@Component({
  selector: 'myb-owner-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
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
  allUnits: Unit[] = []; // Store all units
  coproperties = signal<Array<{id: string, name: string}>>([]);
  selectedCopropertyForFilter = signal<string>('');
  displayedColumns: string[] = ['name', 'email', 'phone', 'units', 'actions'];
  searchTerm: string = '';
  unitSearchTerm: string = '';
  showAddForm: boolean = false;
  ownerForm: FormGroup;
  editingOwnerId: string | null = null;
  loading = signal<boolean>(false);
  alert = signal<{type: 'success' | 'danger' | 'warning' | null, message: string}>({type: null, message: ''});

  constructor() {
    this.ownerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      selectedUnits: [<string[]>[], Validators.required],
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
        next: (owners) => {
          console.log('[Owner Management] Owners loaded:', owners.length);
          this.owners = owners.map(o => ({
            id: o.id,
            userId: o.userId,
            firstName: o.firstName,
            lastName: o.lastName,
            email: o.email,
            phone: o.phone || '',
            ownerUnits: o.ownerUnits || []
          }));
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
  }

  editOwner(owner: Owner): void {
    this.editingOwnerId = owner.id;
    this.showAddForm = true;
    
    const selectedUnitIds = owner.ownerUnits?.map(ou => ou.unitId) || [];
    
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
    if (this.ownerForm.valid) {
      const formValue = this.ownerForm.value;
      const selectedUnitIds: string[] = formValue.selectedUnits || [];
      
      // Validate that at least one unit is selected
      if (selectedUnitIds.length === 0) {
        this.translateService.get('coproperty.owner.unitRequired').subscribe((msg) => {
          this.showAlert('warning', msg || 'Veuillez sélectionner au moins une unité');
        });
        return;
      }
      
      this.loading.set(true);

      // Step 1: Create or find the Keycloak user, then create the owner
      const keycloakUser$ = from(this.resolveKeycloakUserId(formValue));
      
      keycloakUser$.pipe(
        switchMap((keycloakUserId: string) => {
          // Step 2: Create the owner with the real Keycloak user ID
          const input: CreateOwnerWithUnitsInput = {
            userId: keycloakUserId,
            firstName: formValue.firstName,
            lastName: formValue.lastName,
            email: formValue.email,
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
        },
        error: (err) => {
          console.error('[Owner Management] Error saving owner:', err);
          this.translateService.get('coproperty.messages.error').subscribe((msg) => {
            this.showAlert('danger', msg);
          });
        }
      });
    } else {
      this.translateService.get('validation.required').subscribe((msg) => {
        this.showAlert('warning', msg);
      });
    }
  }

  /**
   * Find existing Keycloak user by email, or create a new one.
   * Returns the Keycloak user ID (UUID).
   */
  private async resolveKeycloakUserId(formValue: any): Promise<string> {
    const email = formValue.email;
    
    // Check if user already exists in Keycloak
    const existingUserId = await this.keycloakService.findUserByEmail(email);
    if (existingUserId) {
      console.log('[Owner Management] Keycloak user already exists:', existingUserId);
      // Ensure the coproperty-owner role is assigned
      await this.keycloakService.assignRoleToUser(existingUserId, 'coproperty-owner');
      return existingUserId;
    }

    // Create a new Keycloak user with a temporary password
    const defaultPassword = 'Changeme123!';
    const newUserId = await this.keycloakService.createUser({
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: email,
      password: defaultPassword,
      role: 'coproperty-owner',
      enabled: true,
    });

    console.log('[Owner Management] Created new Keycloak user:', newUserId);
    return newUserId;
  }

  cancelForm(): void {
    this.showAddForm = false;
    this.editingOwnerId = null;
    this.ownerForm.reset();
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

  private showAlert(type: 'success' | 'danger' | 'warning', message: string) {
    this.alert.set({type, message});
    setTimeout(() => this.alert.set({type: null, message: ''}), 5000);
  }
}
