import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClientCardComponent } from '../client-card/clientCard.component';
import { Observable } from 'rxjs';
import { Client } from '../../../models/client.model';
import { ClientService } from '../../../services/client.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateClientComponent } from '../create-client/createClient.component';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'myb-front-list-client',
  standalone: true,
  imports: [CommonModule, RouterLink, ClientCardComponent,CreateClientComponent,FormsModule,TranslateModule],
  templateUrl: './listClient.component.html',
  styleUrl: './listClient.component.css',
})
export class ListClientComponent {
  clientService = inject(ClientService);
  clients$ : Observable<Client[]> = this.clientService.clients$;
  searchTerm: string = '';
  activeTab: string = 'ACTIVE';

  modalService = inject(NgbModal);

  open() {
		this.modalService.open(CreateClientComponent, { size: 'lg' });
	}
  setActiveTab(tab: 'ACTIVE' | 'ARCHIVED') {
    this.activeTab = tab;
  }
  

  showClient(client: Client) : boolean{
    var result = true;
    if(this.activeTab == 'ACTIVE' && client.isArchived == true){
      return false;
    }
    if(this.activeTab == 'ARCHIVED' && client.isArchived == false){
      return false;
    }
    if(client.firstName!.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
    client.lastName!.toLowerCase().includes(this.searchTerm.toLowerCase())){
      result = true;
    }
    else{
      result = false;
    }

    return result;
  }
}
