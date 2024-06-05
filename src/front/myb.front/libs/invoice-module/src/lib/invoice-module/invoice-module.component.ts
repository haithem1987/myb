import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invoice } from '../models/invoice.model';
import { InvoiceService } from '../services/invoice.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditInvoiceComponent } from '../components/edit-invoice/editInvoice.component';
import { CreateInvoiceComponent } from '../components/create-invoice/createInvoice.component';

@Component({
  selector: 'myb-front-invoice-module',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-module.component.html',
  styleUrl: './invoice-module.component.css',
})
export class InvoiceModuleComponent implements OnInit {
  invoices: Invoice[] = [];
  private modalService = inject(NgbModal);
  private invoiceService = inject(InvoiceService);

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices() {
    this.invoiceService.getAll().subscribe((invoices) => {
      console.log(invoices);
      this.invoices = invoices;
    });
  }
  /* open() {
		const modalRef = this.modalService.open(EditInvoiceComponent);
		modalRef.componentInstance.name = 'World';
	} */

  open() {
    const modalRef = this.modalService.open(CreateInvoiceComponent);
  }
  openEditModal(){
    const modalRef = this.modalService.open(EditInvoiceComponent);
  }
}
