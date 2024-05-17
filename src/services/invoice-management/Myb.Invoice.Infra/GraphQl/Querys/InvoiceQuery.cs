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
    }
}
