using HotChocolate;
using Myb.Invoice.Models;
using Myb.Invoice.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;


namespace Myb.Invoice.Infra.GraphQl.Querys
{
    public class InvoiceQuery
    {
        public Task<IEnumerable<InvoiceModel?>> GetAllInvoices([Service] IInvoiceService invoiceService) => invoiceService.GetAll();
        public Task<IEnumerable<InvoiceModel?>> GetInvoicesByIds([Service] IInvoiceService invoiceService , IEnumerable<int?> ids) => invoiceService.GetByIds(ids);
        public Task<InvoiceModel?> GetInvoiceByID([Service] IInvoiceService invoiceService, int id) => invoiceService.GetById(id);


        public Task<IEnumerable<Client?>> GetAllClients([Service] IClientService clientService) => clientService.GetAll();
        public Task<IEnumerable<Client?>> GetClientsByIds([Service] IClientService clientService, IEnumerable<int?> ids) => clientService.GetByIds(ids);
        public Task<Client?> GetClientByID([Service] IClientService clientService, int id) => clientService.GetById(id);

        public Task<IEnumerable<Product?>> GetAllProducts([Service] IProductService productService) => productService.GetAll();
        public Task<IEnumerable<Product?>> GetProductsByIds([Service] IProductService productService, IEnumerable<int?> ids) => productService.GetByIds(ids);
        public Task<Product?> GetProductByID([Service] IProductService productService, int id) => productService.GetById(id);


        public Task<IEnumerable<InvoiceDetails?>> GetAllInvoiceDetails([Service] IInvoiceDetailsService invoiceDateilsService) => invoiceDateilsService.GetAll();
        public Task<IEnumerable<InvoiceDetails?>> GetInvoiceDetailsByIds([Service] IInvoiceDetailsService invoiceDateilsService, IEnumerable<int?> ids) => invoiceDateilsService.GetByIds(ids);
        public Task<InvoiceDetails?> GetInvoiceDetailsByID([Service] IInvoiceDetailsService invoiceDateilsService, int id) => invoiceDateilsService.GetById(id);


        public Task<IEnumerable<Contact?>> GetAllContacts([Service] IContactService contactService) => contactService.GetAll();
        public Task<IEnumerable<Contact?>> GetConatctsByIds([Service] IContactService contactService, IEnumerable<int?> ids) => contactService.GetByIds(ids);
        public Task<Contact?> GetContactByID([Service] IContactService contactService, int id) => contactService.GetById(id);


        public Task<IEnumerable<Tax?>> GetAllTaxes([Service] ITaxService taxService) => taxService.GetAll();
        public Task<IEnumerable<Tax?>> GetTaxesByIds([Service] ITaxService taxService, IEnumerable<int?> ids) => taxService.GetByIds(ids);
        public Task<Tax?> GetTaxByID([Service] ITaxService taxService, int id) => taxService.GetById(id);
    }
}
