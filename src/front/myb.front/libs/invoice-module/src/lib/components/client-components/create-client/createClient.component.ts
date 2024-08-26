import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ToastService } from 'libs/shared/infra/services/toast.service';
import { Router, RouterLink } from '@angular/router';
import { ClientService } from '../../../services/client.service';
import { ContactService } from '../../../services/contact.service';
import { Contact } from '../../../models/contact.model';
import { ClientType } from '../../../models/clientType';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddContactComponent } from './add-contact/addContact.component';
import { Observable, Subscription } from 'rxjs';
import { Client } from '../../../models/client.model';

@Component({
  selector: 'myb-front-create-client',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './createClient.component.html',
  styleUrl: './createClient.component.css',
})
export class CreateClientComponent implements OnInit {
  private toastService = inject(ToastService);
  private clientService = inject(ClientService);
  private modalService = inject(NgbModal);
	private activeModal = inject(NgbActiveModal);

  errorMessage: string = '';

  contacts: Contact[] = [];
  clientType: ClientType = ClientType.Private;

  ngOnInit(): void {}

  clientForm: FormGroup = new FormGroup({
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    clientAddress: new FormControl('', Validators.required),
  });

  save(): void {
    const client = new Client();
    if (this.clientForm.valid && this.contacts.length > 0) {
      client.createdAt = new Date();
      client.updatedAt = new Date();
      client.contacts = this.contacts;
      client.firstName = this.clientForm.value.firstName;
      client.lastName = this.clientForm.value.lastName;
      client.address = this.clientForm.value.clientAddress;
      client.clientType = this.clientType;
      client.isArchived = false;

      this.clientService.create(client).subscribe(() => {
        this.toastService.show('Client created successfully!', {
          classname: 'bg-success text-light',
        });
        this.closeModal()
      });
    }else {
      this.errorMessage = 'contact is required !';
      this.clientForm.markAllAsTouched();
    }
  }

  setTypeToPrivate(): void {
    this.clientType = ClientType.Private;
  }
  setTypeToCompany(): void {
    this.clientType = ClientType.Company;
  }

  openModal(): void {
    const modalRef = this.modalService.open(AddContactComponent);
    modalRef.componentInstance.contactEntered.subscribe((contact: Contact) => {
      if (contact) {
        this.contacts.push(contact);
      }
    });
  }
  deleteContact(contactToDelete: Contact): void{
    this.contacts = this.contacts.filter(
      (contact) => contact != contactToDelete
    );
  }
  closeModal(): void {
    this.activeModal.dismiss();
  }

  trackByFn(index: number, item: Contact): number {
    return index;
  }

  
}
