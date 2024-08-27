using Microsoft.EntityFrameworkCore;
using Myb.Common.Repositories;
using Myb.Invoice.EntityFrameWork.Infra;
using Myb.Invoice.Models;

namespace Myb.Invoice.Services
{
    public class InvoiceService : IInvoiceService
    {
        private readonly IGenericRepository<int?, InvoiceModel, InvoiceContext> _invoiceRepository;
        private readonly IInvoiceDetailsService _invoiceDetailsService;

        public InvoiceService(IGenericRepository<int?, InvoiceModel, InvoiceContext> invoiceRepository, IInvoiceDetailsService invoiceDetailsService)
        {
            _invoiceRepository = invoiceRepository;
            _invoiceDetailsService = invoiceDetailsService;
        }

        public async Task<InvoiceModel?> Add(InvoiceModel invoice)
        {
            var invoiceDetails = invoice.InvoiceDetails;
            invoice.InvoiceDetails = null;
            var responce = await _invoiceRepository.InsertAsync(invoice);
            var newInvoice = responce.Entity;
            List<InvoiceDetails> invoiceDetailsList = new List<InvoiceDetails>();
            foreach(var item in invoiceDetails!)
            {
                item.InvoiceID = newInvoice!.Id;
                var newItem = await _invoiceDetailsService.Add(item);
                invoiceDetailsList.Add(newItem!);
            }
            newInvoice!.InvoiceDetails = invoiceDetailsList;
            return newInvoice;
        }

        public async Task<InvoiceModel?> Delete(int id)
        {
            var responce = await _invoiceRepository.DeleteAsync(id);
            return responce.Entity;
        }

        public Task<IEnumerable<InvoiceModel?>> GetAll()
        {
            return Task.FromResult<IEnumerable<InvoiceModel?>>(_invoiceRepository.GetAll().Include(I => I.InvoiceDetails));
        }

        public Task<InvoiceModel?> GetById(int id)
        {
            return Task.FromResult<InvoiceModel?>(_invoiceRepository.GetAll().Include(I => I.InvoiceDetails).FirstOrDefault(i => i.Id == id));
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
