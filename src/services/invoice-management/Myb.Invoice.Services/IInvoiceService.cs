using System;
using Myb.Invoice.Models;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.Invoice.Services
{
    public interface IInvoiceService
    {
        Task<InvoiceModel?> Add(InvoiceModel invoice);
        Task<InvoiceModel?> Update(InvoiceModel invoice);
        Task<IEnumerable<InvoiceModel?>> GetAll();
        Task<IEnumerable<InvoiceModel?>> GetByIds(IEnumerable<int?> ids);
        Task<InvoiceModel?> GetById(int id);
        Task<InvoiceModel?> Delete(int id);
        
    }
}
