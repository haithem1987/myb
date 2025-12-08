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
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from 'libs/shared/infra/services/toast.service';

@Component({
  selector: 'myb-front-list-invoice',
  standalone: true,
  imports: [CommonModule,
    RouterModule,
    NavbarComponent,
    RouterLink,
    FormsModule,
    TranslateModule
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
  activeTab: string = 'ACTIVE';
  searchTerm: string = '';
  private toastService = inject(ToastService);
  

  setActiveTab(tab: 'ACTIVE' | 'ARCHIVED') {
    this.activeTab = tab;
  }

  openCreate():void {
    this.router.navigate(['/create']);
  }
  

  getClientName(clientId: number): string {
    let clientName = '';
    this.clients$.subscribe((clients) => {
      const client = clients.find((client) => client.id === clientId);
      clientName = client ? client.firstName + ' '+ client.lastName: 'Unknown client';
    });
    return clientName;
  }
  archiveInvoice(invoice: Invoice) {
    const updatedInvoice = { ...invoice, isArchived: true };
    this.invoiceService
      .update(invoice.id, updatedInvoice)
      .subscribe((response) => {
        this.toastService.show('Invoice archived successfully!', {
          classname: 'bg-success text-light',
        });
      });
  }
  restoreInvoice(invoice: Invoice) {
    const updatedInvoice = { ...invoice, isArchived: false };
    this.invoiceService
      .update(invoice.id, updatedInvoice)
      .subscribe((response) => {
        this.toastService.show('Invoice restored successfully!', {
          classname: 'bg-success text-light',
        });
      });
  }

  showInvoice(invoice: Invoice): boolean {
    var result = true;
    if (this.activeTab == 'ACTIVE' && invoice.isArchived == true) {
      return false;
    }
    if (this.activeTab == 'ARCHIVED' && invoice.isArchived == false) {
      return false;
    }
    if (invoice.invoiceNum!.toLowerCase().includes(this.searchTerm.toLowerCase())) {
      result = true;
    } else {
      result = false;
    }

    return result;
  }
}
