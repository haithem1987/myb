using Myb.Invoice.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.Invoice.Services
{
    public interface IInvoiceDetailsService
    {
        Task<InvoiceDetails?> Add(InvoiceDetails invoiceDetails);
        Task<InvoiceDetails?> Update(InvoiceDetails invoiceDetails);
        Task<IEnumerable<InvoiceDetails?>> GetAll();
        Task<IEnumerable<InvoiceDetails?>> GetByIds(IEnumerable<int?> ids);
        Task<InvoiceDetails?> GetById(int id);
        Task<InvoiceDetails?> Delete(int id);
    }
}
