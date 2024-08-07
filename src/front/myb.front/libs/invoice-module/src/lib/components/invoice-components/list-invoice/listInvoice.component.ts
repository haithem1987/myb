import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invoice } from '../../../models/invoice.model';
import { InvoiceService } from '../../../services/invoice.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditInvoiceComponent } from '../../invoice-components/edit-invoice/editInvoice.component';
import { CreateInvoiceComponent } from '../../invoice-components/create-invoice/createInvoice.component';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { Observable } from 'rxjs';
import { ClientService } from '../../../services/client.service';
import { Client } from '../../../models/client.model';

@Component({
  selector: 'myb-front-list-invoice',
  standalone: true,
  imports: [CommonModule,
    RouterModule,
    NavbarComponent,
    RouterLink
  ],
  templateUrl: './listInvoice.component.html',
  styleUrl: './listInvoice.component.css',
})
export class ListInvoiceComponent {
  private modalService = inject(NgbModal);
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);
  clientService = inject(ClientService);
  clients$ : Observable<Client[]>= this.clientService.clients$
  invoices$ : Observable<Invoice[]> = this.invoiceService.invoices$;
  
  /* open() {
		const modalRef = this.modalService.open(EditInvoiceComponent);
		modalRef.componentInstance.name = 'World';
	} */

  openCreate():void {
    this.router.navigate(['/create']);
  }
  openEditModal(){
    const modalRef = this.modalService.open(EditInvoiceComponent);
  }

  getClientName(clientId: number): string {
    let clientName = '';
    this.clients$.subscribe((clients) => {
      const client = clients.find((client) => client.id === clientId);
      clientName = client ? client.firstName + ' '+ client.lastName: 'Unknown client';
    });
    return clientName;
  }
}
