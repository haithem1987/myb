import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invoice } from '../models/invoice.model';
import { InvoiceService } from '../services/invoice.service';

@Component({
  selector: 'myb-front-invoice-module',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-module.component.html',
  styleUrl: './invoice-module.component.css',
})
export class InvoiceModuleComponent implements OnInit {
  invoices: Invoice[] = [];

  constructor(private invoiceService: InvoiceService) {}
  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices() {
    this.invoiceService.getAll().subscribe((invoices) => {
      console.log(invoices);
      this.invoices = invoices;
    });
  }
}
