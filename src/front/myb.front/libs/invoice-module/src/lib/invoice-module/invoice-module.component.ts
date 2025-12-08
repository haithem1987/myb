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
import { BreadcrumbComponent, ToastsContainerComponent } from '@myb-front/shared-ui';
import { FolderDetailsComponent } from '@myb-front/doc-management-module';

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
    FolderDetailsComponent,
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
