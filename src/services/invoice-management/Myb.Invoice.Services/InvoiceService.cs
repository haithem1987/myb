using Myb.Common.Repositories;
using Myb.Invoice.EntityFrameWork.Infra;
using Myb.Invoice.Models;

namespace Myb.Invoice.Services
{
    public class InvoiceService : IInvoiceService
    {
        private readonly IGenericRepository<int?, InvoiceModel, InvoiceContext> _invoiceRepository;

        public InvoiceService(IGenericRepository<int?, InvoiceModel, InvoiceContext> invoiceRepository)
        {
            _invoiceRepository = invoiceRepository;
        }

        public async Task<InvoiceModel?> Add(InvoiceModel invoice)
        {
            var responce = await _invoiceRepository.InsertAsync(invoice);
            return responce.Entity;
        }

        public async Task<InvoiceModel?> Delete(int id)
        {
            var responce = await _invoiceRepository.DeleteAsync(id);
            return responce.Entity;
        }

        public Task<IEnumerable<InvoiceModel?>> GetAll()
        {
            return Task.FromResult<IEnumerable<InvoiceModel?>>(_invoiceRepository.GetAll());
        }

        public Task<InvoiceModel?> GetById(int id)
        {
            return Task.FromResult<InvoiceModel?>(_invoiceRepository.GetById(id));
        }

        public Task<IEnumerable<InvoiceModel?>> GetByIds(IEnumerable<int?> ids)
        {
            return Task.FromResult<IEnumerable<InvoiceModel?>>(_invoiceRepository.GetByIds(ids));
        }

        public async Task<InvoiceModel?> Update(InvoiceModel invoice)
        {
            var responce = await _invoiceRepository.UpdateAsync(invoice);
            return responce.Entity;
        }
    }
}
