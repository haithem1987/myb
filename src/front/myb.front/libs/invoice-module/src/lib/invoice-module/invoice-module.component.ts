import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invoice } from '../models/invoice.model';
import { InvoiceService } from '../services/invoice.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditInvoiceComponent } from '../components/edit-invoice/editInvoice.component';
import { CreateInvoiceComponent } from '../components/create-invoice/createInvoice.component';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { ListInvoiceComponent } from '../components/list-invoice/listInvoice.component';
import {BreadcrumbComponent} from '../../../../time-sheet-module/src/lib/components/breadcrumb/breadcrumb.component'
import {ToastsContainerComponent} from '../../../../shared/shared-ui/src/lib/components/toasts-container/toasts-container.component'
import { DocModuleWidgetComponent } from 'libs/doc-management-module/src/lib/doc-module-widget/doc-module-widget.component';
import { FolderDetailsComponent } from '@myb-front/doc-management-module';
import { FolderListComponent } from 'libs/doc-management-module/src/lib/components/Folders/folder-list/folder-list.component';


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
    DocModuleWidgetComponent,
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
  
  fId!:number ; 
  folderTitle! :string;
  ngOnInit(): void {}

  onFolderSelected(folderId: number): void {
    this.fId = folderId;
  }
}
