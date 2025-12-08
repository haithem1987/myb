import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ClientType } from 'libs/invoice-module/src/lib/models/clientType';
import { ContactType } from 'libs/invoice-module/src/lib/models/contactType';
import { ContactService } from 'libs/invoice-module/src/lib/services/contact.service';
import { Contact } from 'libs/invoice-module/src/lib/models/contact.model';

@Component({
  selector: 'myb-front-add-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './addContact.component.html',
  styleUrl: './addContact.component.css',
})
export class AddContactComponent {
  contact: Contact = new Contact();

  @Output() contactEntered = new EventEmitter<Contact>();

  contactType: ContactType = ContactType.Email;
  activeModal = inject(NgbActiveModal);

  contactForm: FormGroup = new FormGroup({
    credentials: new FormControl('', Validators.required),
  });

  closeModal(): void {
    this.activeModal.dismiss();
  }

  setTypeToEmail(): void {
    this.contactType = ContactType.Email;
    console.log(this.contactType);
  }
  setTypeToPhone(): void {
    this.contactType = ContactType.Phone;
    console.log(this.contactType);
  }

  save(): void {
    if (this.contactForm.valid) {
      this.contact.type = this.contactType;
      this.contact.credentials = this.contactForm.value.credentials;
      this.contactEntered.emit(this.contact);
      this.closeModal();
    }else {
      this.contactForm.markAllAsTouched();
    }
  }
}
