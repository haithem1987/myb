import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ListInvoiceComponent} from '../list-invoice/listInvoice.component'

@Component({
  selector: 'myb-front-invoice-index',
  standalone: true,
  imports: [CommonModule,ListInvoiceComponent],
  templateUrl: './invoiceIndex.component.html',
  styleUrl: './invoiceIndex.component.css',
})
export class InvoiceIndexComponent {}
