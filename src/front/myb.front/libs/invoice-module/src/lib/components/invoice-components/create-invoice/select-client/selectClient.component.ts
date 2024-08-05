import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateClientComponent } from '../../../client-components/create-client/createClient.component';
import { Observable } from 'rxjs';
import { ClientService } from 'libs/invoice-module/src/lib/services/client.service';
import { Client } from 'libs/invoice-module/src/lib/models/client.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'myb-front-select-client',
  standalone: true,
  imports: [CommonModule, CreateClientComponent,FormsModule],
  templateUrl: './selectClient.component.html',
  styleUrl: './selectClient.component.css',
})
export class SelectClientComponent {
  @Output() clientEntered = new EventEmitter<Client>();

  activeModal = inject(NgbActiveModal);
  modalService = inject(NgbModal);
  clientService = inject(ClientService);
  clients$: Observable<Client[]> = this.clientService.clients$;
  searchTerm: string = '';

  closeModal(): void {
    this.activeModal.dismiss();
  }

  openModal() {
    this.modalService.open(CreateClientComponent, { size: 'lg' });
  }

  selectClient(client: Client): void {
    this.clientEntered.emit(client);
    this.closeModal();
  }
}
