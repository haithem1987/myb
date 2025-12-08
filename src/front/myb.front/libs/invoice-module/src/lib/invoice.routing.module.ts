import { RouterModule, Routes } from '@angular/router';
import { InvoiceModuleComponent } from './invoice-module/invoice-module.component';
import { NgModule } from '@angular/core';
import { InvoiceDetailsComponent } from './components/invoice-components/details-invoice/invoiceDetails.component';
import { CreateInvoiceComponent } from './components/invoice-components/create-invoice/createInvoice.component';
import { InvoiceIndexComponent } from './components/invoice-components/index/invoiceIndex.component';
import { ListClientComponent } from './components/client-components/list-client/listClient.component';
import { ListProductComponent } from './components/product-components/list-product/listProduct.component';
import { CreateProductComponent } from './components/product-components/create-product/createProduct.component';
import { ProductComponent } from './components/product-components/index/product.component';
import { CreateClientComponent } from './components/client-components/create-client/createClient.component';
import { ClientComponent } from './components/client-components/index/client.component';
import { TaxComponent } from './components/tax-component/index/tax.component';
import { ListTaxComponent } from './components/tax-component/list-tax/listTax.component';
import { CreateTaxComponent } from './components/tax-component/create-tax/createTax.component';

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
          breadcrumb: 'Invoices',
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
          breadcrumb: 'new Invoice',
        },
      },
      {
        path: 'clients',
        component: ClientComponent,
        data: {
          breadcrumb: 'client',
        },
        children: [
          {
            path: '',
            component: ListClientComponent,
            data: {
              breadcrumb: 'Clients',
            },
          },
          /* {
            path: 'createClient',
            component: CreateClientComponent,
            data: {
              breadcrumb: 'new Client',
            },
          }, */
        ],
      },
      {
        path: 'products',
        component: ProductComponent,
        data: {
          breadcrumb: 'Product',
        },
        children: [
          {
            path: '',
            component: ListProductComponent,
            data: {
              breadcrumb: 'Products',
            },
          },
         /*  {
            path: 'createProduct',
            component: CreateProductComponent,
            data: {
              breadcrumb: 'new Product',
            },
          }, */
        ],
      },
      {
        path: 'taxes',
        component: TaxComponent,
        data: {
          breadcrumb: 'Tax',
        },
        children: [
          {
            path: '',
            component: ListTaxComponent,
            data: {
              breadcrumb: 'Taxes',
            },
          },
          {
            path: 'createTax',
            component: CreateTaxComponent,
            data: {
              breadcrumb: 'new Tax',
            },
          },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(invoiceRoutes)],
  exports: [RouterModule],
})
export class InvoiceRoutingModule {}
