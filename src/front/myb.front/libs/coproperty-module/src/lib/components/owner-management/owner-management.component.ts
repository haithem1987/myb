import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  units: any[];
}

@Component({
  selector: 'myb-owner-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './owner-management.component.html',
  styleUrls: ['./owner-management.component.scss'],
})
export class OwnerManagementComponent implements OnInit {
  owners: Owner[] = [];
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
      address: [''],
    });
  }

  ngOnInit(): void {
    this.loadOwners();
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
        address: '123 rue de la Paix',
        units: [{ unitNumber: 'A101' }],
      },
      {
        id: '2',
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'marie.martin@example.com',
        phone: '+33987654321',
        units: [{ unitNumber: 'B201' }],
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
  }

  editOwner(owner: Owner): void {
    this.editingOwnerId = owner.id;
    this.showAddForm = true;
    this.ownerForm.patchValue({
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: owner.email,
      phone: owner.phone,
      address: owner.address,
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
      // TODO: Implement GraphQL mutation to create/update owner
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
}
