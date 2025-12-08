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
    public class TaxService : ITaxService
    {

        private readonly IGenericRepository<int?, Tax, InvoiceContext> _taxRepository;

        public TaxService(IGenericRepository<int?, Tax, InvoiceContext> taxRepository) 
        {
            _taxRepository = taxRepository;
        }
        public async Task<Tax?> Add(Tax tax)
        {
            var responce = await _taxRepository.InsertAsync(tax);
            return responce.Entity;
        }

        public async Task<Tax?> Delete(int id)
        {
            var responce = await _taxRepository.DeleteAsync(id);
            return responce.Entity;
        }

        public Task<IEnumerable<Tax?>> GetAll()
        {
            return Task.FromResult<IEnumerable<Tax?>>(_taxRepository.GetAll());
        }

        public Task<Tax?> GetById(int id)
        {
            return Task.FromResult<Tax?>(_taxRepository.GetById(id));
        }

        public Task<IEnumerable<Tax?>> GetByIds(IEnumerable<int?> ids)
        {
            return Task.FromResult<IEnumerable<Tax?>>(_taxRepository.GetByIds(ids));
        }

        public async Task<Tax?> Update(Tax tax)
        {
            var responce = await _taxRepository.UpdateAsync(tax);
            return responce.Entity;
        }
    }
}
