import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CreateOwnerWithUnitsInput, OwnerUnitInput } from '../../models/owner.model';

interface Unit {
  id: string;
  unitNumber: string;
  copropertyId?: string;
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
  
  owners: Owner[] = [];
  availableUnits: Unit[] = [];
  displayedColumns: string[] = ['name', 'email', 'phone', 'units', 'actions'];
  searchTerm: string = '';
  showAddForm: boolean = false;
  ownerForm: FormGroup;
  editingOwnerId: string | null = null;

  constructor(private fb: FormBuilder) {
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
    // TODO: Implement GraphQL query to fetch units for the coproperty
    // Mock data
    this.availableUnits = [
      { id: '1', unitNumber: 'A101', copropertyId: this.copropertyId },
      { id: '2', unitNumber: 'A102', copropertyId: this.copropertyId },
      { id: '3', unitNumber: 'B201', copropertyId: this.copropertyId },
      { id: '4', unitNumber: 'B202', copropertyId: this.copropertyId },
    ];
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
    this.ownerForm.patchValue({ selectedUnits: [] });
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
    if (confirm(`Are you sure you want to delete ${owner.firstName} ${owner.lastName}?`)) {
      // TODO: Implement GraphQL mutation to delete owner
      this.owners = this.owners.filter((o) => o.id !== owner.id);
    }
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
      alert('Owner saved successfully');
      this.showAddForm = false;
      this.ownerForm.reset();
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
}
