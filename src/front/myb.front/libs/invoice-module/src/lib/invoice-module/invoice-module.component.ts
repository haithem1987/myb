import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invoice } from '../models/invoice.model';
import { InvoiceService } from '../services/invoice.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditInvoiceComponent } from '../components/invoice-components/edit-invoice/editInvoice.component';
import { CreateInvoiceComponent } from '../components/invoice-components/create-invoice/createInvoice.component';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { ListInvoiceComponent } from '../components/invoice-components/list-invoice/listInvoice.component';
import { ToastsContainerComponent } from '../../../../shared/shared-ui/src/lib/components/toasts-container/toasts-container.component';
import { BreadcrumbComponent } from '@myb-front/shared-ui';

@Component({
  selector: 'myb-front-invoice-module',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    RouterOutlet,
    ListInvoiceComponent,
    CreateInvoiceComponent,
    BreadcrumbComponent,
    ToastsContainerComponent,
  ],
  templateUrl: './invoice-module.component.html',
  styleUrl: './invoice-module.component.css',
})
export class InvoiceModuleComponent implements OnInit {
  invoices: Invoice[] = [];
  private modalService = inject(NgbModal);
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);

  ngOnInit(): void {}
}
