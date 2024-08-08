import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@myb-front/shared-ui';
import { Client } from '../../../models/client.model';
import { ClientService } from '../../../services/client.service';
import { ToastService } from 'libs/shared/infra/services/toast.service';

@Component({
  selector: 'myb-front-client-card',
  standalone: true,
  imports: [CommonModule,CardComponent],
  templateUrl: './clientCard.component.html',
  styleUrl: './clientCard.component.css',
})
export class ClientCardComponent {
  @Input() client!: Client;

  private clientService = inject(ClientService);
  private toastService = inject(ToastService);
  

  archiveClient(){
    const updatedClient = {...this.client, isArchived: true};
    this.clientService.update(this.client.id, updatedClient).subscribe((response)=>{
      this.toastService.show('Client archived successfully!', {
        classname: 'bg-success text-light',
      });
    });
  }
  restoreClient(){
    const updatedClient = {...this.client, isArchived: false};
    this.clientService.update(this.client.id, updatedClient).subscribe((response)=>{
      this.toastService.show('Client restored successfully!', {
        classname: 'bg-success text-light',
      });
    });
  }
}
