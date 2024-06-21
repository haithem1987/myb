import { RouterModule, Routes } from '@angular/router';
import { InvoiceModuleComponent } from './invoice-module/invoice-module.component';
import { NgModule } from '@angular/core';
import { InvoiceDetailsComponent } from './components/details-invoice/invoiceDetails.component';
import { CreateInvoiceComponent } from './components/create-invoice/createInvoice.component';
import { InvoiceIndexComponent } from './components/index/invoiceIndex.component';

export const invoiceRoutes: Routes = [
  {
    path: '',
    component: InvoiceModuleComponent,
    data: {
      breadcrumb: 'Invoice',
    },
    children: [
      {
        path: '',
        component: InvoiceIndexComponent,
        data: {
          breadcrumb: 'list',
        },
      },
      {
                path: 'details/:id',
                component: InvoiceDetailsComponent,
                data: {
                    breadcrumb: 'details',
                },
            },
      {
        path: 'create',
        component: CreateInvoiceComponent,
        data: {
          breadcrumb: 'new',
        },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(invoiceRoutes)],
  exports: [RouterModule],
})
export class InvoiceRoutingModule {}
