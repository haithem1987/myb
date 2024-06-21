import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invoice } from '../../models/invoice.model';
import { InvoiceService } from '../../services/invoice.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditInvoiceComponent } from '../../components/edit-invoice/editInvoice.component';
import { CreateInvoiceComponent } from '../../components/create-invoice/createInvoice.component';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';

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
export class ListInvoiceComponent implements OnInit{
  invoices: Invoice[] = [];
  private modalService = inject(NgbModal);
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);

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

  openCreate():void {
    this.router.navigate(['/create']);
  }
  openEditModal(){
    const modalRef = this.modalService.open(EditInvoiceComponent);
  }
}
