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


        public Task<IEnumerable<ProductLine?>> GetAllProductLines([Service] IProductLineService productLineService) => productLineService.GetAll();
        public Task<IEnumerable<ProductLine?>> GetProductLinesByIds([Service] IProductLineService productLineService, IEnumerable<int?> ids) => productLineService.GetByIds(ids);
        public Task<ProductLine?> GetProductLineByID([Service] IProductLineService productLineService, int id) => productLineService.GetById(id);


        public Task<IEnumerable<Contact?>> GetAllConatcts([Service] IContactService contactService) => contactService.GetAll();
        public Task<IEnumerable<Contact?>> GetConatctsByIds([Service] IContactService contactService, IEnumerable<int?> ids) => contactService.GetByIds(ids);
        public Task<Contact?> GetContactByID([Service] IContactService contactService, int id) => contactService.GetById(id);
    }
}
