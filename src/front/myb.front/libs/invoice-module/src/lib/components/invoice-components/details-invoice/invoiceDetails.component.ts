import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceService } from '../../../services/invoice.service';
import { Invoice } from '../../../models/invoice.model';
import { ActivatedRoute } from '@angular/router';
import { Client } from '../../../models/client.model';
import { ClientService } from '../../../services/client.service';

@Component({
  selector: 'myb-front-invoice-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoiceDetails.component.html',
  styleUrl: './invoiceDetails.component.css',
})
export class InvoiceDetailsComponent implements OnInit{
  invoiceService = inject(InvoiceService);
  clientService = inject(ClientService);
  router = inject(ActivatedRoute);

  invoice? : Invoice;
  client? : Client;
  ngOnInit(): void {
    const id = this.router.snapshot.paramMap.get('id');
    this.invoiceService.get(parseInt(id!)).subscribe((invoice)=>{
      this.invoice = invoice;
      this.getClient(invoice.clientID!);
    });
  }

  getClient(id: number){
    this.clientService.get(id).subscribe((client)=>{
      this.client = client;
    })
  }
  getTaxValue(): number {
    if (this.invoice && this.invoice.totalAmount !== undefined && this.invoice.subTotal !== undefined) {
        return this.invoice.totalAmount - this.invoice.subTotal;
    }
    return 0; 
}
}
