using Myb.Common.Repositories;
using Myb.Invoice.EntityFrameWork.Infra;
using Myb.Invoice.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.Invoice.Services
{
    public class InvoiceDetailsService : IInvoiceDetailsService
    {

        private readonly IGenericRepository<int?, InvoiceDetails, InvoiceContext> _invoiceDetailsRepository;

        public InvoiceDetailsService(IGenericRepository<int?, InvoiceDetails, InvoiceContext> invoiceDetailsRepository)
        {
            _invoiceDetailsRepository = invoiceDetailsRepository;
        }

        public async Task<InvoiceDetails?> Add(InvoiceDetails invoiceDetails)
        {
            var responce = await _invoiceDetailsRepository.InsertAsync(invoiceDetails);
            return responce.Entity;
        }

        public async Task<InvoiceDetails?> Delete(int id)
        {
            var responce = await _invoiceDetailsRepository.DeleteAsync(id);
            return responce.Entity;
        }

        public Task<IEnumerable<InvoiceDetails?>> GetAll()
        {
            return Task.FromResult<IEnumerable<InvoiceDetails?>>(_invoiceDetailsRepository.GetAll());
        }

        public Task<InvoiceDetails?> GetById(int id)
        {
            return Task.FromResult<InvoiceDetails?>(_invoiceDetailsRepository.GetById(id));
        }

        public Task<IEnumerable<InvoiceDetails?>> GetByIds(IEnumerable<int?> ids)
        {
            return Task.FromResult<IEnumerable<InvoiceDetails?>>(_invoiceDetailsRepository.GetByIds(ids));
        }

        public async Task<InvoiceDetails?> Update(InvoiceDetails invoiceDetails)
        {
            var responce = await _invoiceDetailsRepository.UpdateAsync(invoiceDetails);
            return responce.Entity;
        }
    }
}
