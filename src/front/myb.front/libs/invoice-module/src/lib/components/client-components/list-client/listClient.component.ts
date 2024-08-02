import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClientCardComponent } from '../client-card/clientCard.component';
import { Observable } from 'rxjs';
import { Client } from '../../../models/client.model';
import { ClientService } from '../../../services/client.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateClientComponent } from '../create-client/createClient.component';

@Component({
  selector: 'myb-front-list-client',
  standalone: true,
  imports: [CommonModule, RouterLink, ClientCardComponent,CreateClientComponent],
  templateUrl: './listClient.component.html',
  styleUrl: './listClient.component.css',
})
export class ListClientComponent {
  clientService = inject(ClientService);
  clients$ : Observable<Client[]> = this.clientService.clients$;

  modalService = inject(NgbModal);

  open() {
		this.modalService.open(CreateClientComponent, { size: 'lg' });
	}
  
}
