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
    }
}
