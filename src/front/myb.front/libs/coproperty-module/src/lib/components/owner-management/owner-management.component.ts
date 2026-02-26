import { Component, OnInit, Input, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CreateOwnerWithUnitsInput, OwnerUnitInput } from '../../models/owner.model';
import { UnitService, UnitExtended } from '../../services/unit.service';
import { CopropertyService } from '../../services/coproperty.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

interface Unit {
  id: string;
  unitNumber: string;
  copropertyId?: string;
  copropertyName?: string;
}

interface Owner {
  id: string;
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
  private destroyRef = inject(DestroyRef);
  private translateService = inject(TranslateService);
  
  owners: Owner[] = [];
  availableUnits: Unit[] = [];
  allUnits: Unit[] = []; // Store all units
  coproperties = signal<Array<{id: string, name: string}>>([]);
  selectedCopropertyForFilter = signal<string>('');
  displayedColumns: string[] = ['name', 'email', 'phone', 'units', 'actions'];
  searchTerm: string = '';
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
    this.loadOwners();
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

  loadOwners(): void {
    // TODO: Implement GraphQL query to fetch owners
    // Mock data
    this.owners = [
      {
        id: '1',
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@example.com',
        phone: '+33123456789',
        ownerUnits: [
          { 
            id: '1', 
            unitId: '1', 
            ownershipPercentage: 100, 
            isMainOwner: true,
            unit: { id: '1', unitNumber: 'A101' }
          }
        ],
      },
      {
        id: '2',
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'marie.martin@example.com',
        phone: '+33987654321',
        ownerUnits: [
          { 
            id: '2', 
            unitId: '3', 
            ownershipPercentage: 50, 
            isMainOwner: true,
            unit: { id: '3', unitNumber: 'B201' }
          },
          { 
            id: '3', 
            unitId: '4', 
            ownershipPercentage: 100, 
            isMainOwner: false,
            unit: { id: '4', unitNumber: 'B202' }
          }
        ],
      },
    ];
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
        // TODO: Implement GraphQL mutation to delete owner
        this.owners = this.owners.filter((o) => o.id !== owner.id);
        this.translateService.get('coproperty.messages.deleted').subscribe((msg) => {
          this.showAlert('success', msg);
        });
      }
    });
  }

  saveOwner(): void {
    if (this.ownerForm.valid) {
      const formValue = this.ownerForm.value;
      const selectedUnitIds: string[] = formValue.selectedUnits || [];
      
      // Create the input for the GraphQL mutation
      const input: CreateOwnerWithUnitsInput = {
        userId: 'current-user-id', // TODO: Get from auth service
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phone: formValue.phone,
        units: selectedUnitIds.map(unitId => ({
          unitId: unitId,
          ownershipPercentage: 100, // Default value
          isMainOwner: true, // Default value
        }))
      };
      
      // TODO: Implement GraphQL mutation to create/update owner
      console.log('Saving owner with units:', input);
      const messageKey = this.editingOwnerId ? 'coproperty.messages.updated' : 'coproperty.messages.created';
      this.translateService.get(messageKey).subscribe((msg) => {
        this.showAlert('success', msg);
      });
      this.showAddForm = false;
      this.ownerForm.reset();
    } else {
      this.translateService.get('validation.required').subscribe((msg) => {
        this.showAlert('warning', msg);
      });
    }
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
