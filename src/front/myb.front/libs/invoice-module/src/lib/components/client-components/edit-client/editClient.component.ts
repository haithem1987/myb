import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from 'libs/shared/infra/services/toast.service';
import { ClientService } from '../../../services/client.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddContactComponent } from '../create-client/add-contact/addContact.component';
import { Contact } from '../../../models/contact.model';
import { ClientType } from '../../../models/clientType';
import { Client } from '../../../models/client.model';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'myb-front-edit-client',
  standalone: true,
  imports: [CommonModule, AddContactComponent, ReactiveFormsModule],
  templateUrl: './editClient.component.html',
  styleUrls: ['./editClient.component.css'],
})
export class EditClientComponent implements OnInit {
  @Input() client!: Client;

  private toastService = inject(ToastService);
  private clientService = inject(ClientService);
  private modalService = inject(NgbModal);
  private activeModal = inject(NgbActiveModal);

  errorMessage: string = '';
  clientForm!: FormGroup;

  clientType: ClientType = ClientType.Private;

  ngOnInit(): void {
    this.initializeForm();
    this.clientType = this.client.clientType || ClientType.Private;
  }

  private initializeForm(): void {
    this.clientForm = new FormGroup({
      firstName: new FormControl(this.client.firstName, Validators.required),
      lastName: new FormControl(this.client.lastName, Validators.required),
      clientAddress: new FormControl(this.client.address, Validators.required),
    });
  }

  setTypeToPrivate(): void {
    this.clientType = ClientType.Private;
    console.log(this.clientType);
  }

  setTypeToCompany(): void {
    this.clientType = ClientType.Company;
    console.log(this.clientType);
  }

  openModal(): void {
    const modalRef = this.modalService.open(AddContactComponent);
    modalRef.componentInstance.contactEntered.subscribe((contact: Contact) => {
      if (contact) {
        this.client.contacts.push(contact);
      }
    });
  }

  deleteContact(contactToDelete: Contact): void {
    this.client.contacts = this.client.contacts.filter(
      (contact) => contact !== contactToDelete
    );
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }

  trackByFn(index: number, item: Contact): number {
    return index;
  }

  save() {
    if (this.clientForm.valid && this.client.contacts.length > 0) {
      const updatedClient = {
        ...this.client,
        firstName: this.clientForm.value.firstName,
        lastName: this.clientForm.value.lastName,
        address: this.clientForm.value.clientAddress,
        clientType: this.clientType,
      };

      console.log('Sending update:', updatedClient); // Log the data being sent

      this.clientService.update(this.client.id, updatedClient).subscribe(
        (response) => {
          console.log('Update response:', response); // Log the response
          this.toastService.show('Client updated successfully!', {
            classname: 'bg-success text-light',
          });
        },
        (error) => {
          console.error('Update failed:', error);
          this.toastService.show('Failed to update client.', {
            classname: 'bg-danger text-light',
          });
        }
      );
      this.closeModal();
    } else {
      this.errorMessage = 'Contact is required!';
      this.clientForm.markAllAsTouched();
    }
  }

  clientTypeIsCompany() {
    if (this.client.clientType == ClientType.Company) {
      return true;
    } else {
      return false;
    }
  }
}
