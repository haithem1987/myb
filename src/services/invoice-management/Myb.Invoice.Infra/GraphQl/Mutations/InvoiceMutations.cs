using HotChocolate;
using Myb.Invoice.Models;
using Myb.Invoice.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.Invoice.Infra.GraphQl.Mutations
{
    public class InvoiceMutations
    {
        public Task<InvoiceModel?> AddInvoice([Service] IInvoiceService invoiceService, InvoiceModel invoice) => invoiceService.Add(invoice);

        public Task<InvoiceModel?> UpdateInvoice([Service] IInvoiceService invoiceService, InvoiceModel invoice) => invoiceService.Update(invoice);
        public Task<InvoiceModel?> DeleteInvoice([Service] IInvoiceService invoiceService, int id) => invoiceService.Delete(id);


        public Task<Client?> AddClient([Service] IClientService clientService, Client client) => clientService.Add(client);

        public Task<Client?> UpdateClient([Service] IClientService clientService, Client client) => clientService.Update(client);
        public Task<Client?> DeleteClient([Service] IClientService clientService, int id) => clientService.Delete(id);


        public Task<Product?> AddProduct([Service] IProductService productService, Product product) => productService.Add(product);

        public Task<Product?> UpdateProduct([Service] IProductService productService, Product product) => productService.Update(product);
        public Task<Product?> DeleteProduct([Service] IProductService productService, int id) => productService.Delete(id);


        public Task<InvoiceDetails?> AddInvoiceDetails([Service] IInvoiceDetailsService invoiceDetailsService, InvoiceDetails invoiceDetails) => invoiceDetailsService.Add(invoiceDetails);

        public Task<InvoiceDetails?> UpdateInvoiceDetails([Service] IInvoiceDetailsService invoiceDetailsService, InvoiceDetails invoiceDetails) => invoiceDetailsService.Update(invoiceDetails);
        public Task<InvoiceDetails?> DeleteInvoiceDetails([Service] IInvoiceDetailsService invoiceDetailsService, int id) => invoiceDetailsService.Delete(id);

        public Task<Contact?> AddContact([Service] IContactService contactService, Contact contact) => contactService.Add(contact);

        public Task<Contact?> UpdateContact([Service] IContactService contactService, Contact contact) => contactService.Update(contact);
        public Task<Contact?> DeleteContatc([Service] IContactService contactService, int id) => contactService.Delete(id);


        public Task<Tax?> AddTax([Service] ITaxService taxService, Tax tax) => taxService.Add(tax);

        public Task<Tax?> UpdateTax([Service] ITaxService taxService, Tax tax) => taxService.Update(tax);
        public Task<Tax?> DeleteTax([Service] ITaxService taxService, int id) => taxService.Delete(id);
    }
}
