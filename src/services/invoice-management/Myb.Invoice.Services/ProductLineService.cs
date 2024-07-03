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
    public class ProductLineService : IProductLineService
    {

        private readonly IGenericRepository<int?, ProductLine, InvoiceContext> _productLineRepository;

        public ProductLineService(IGenericRepository<int?, ProductLine, InvoiceContext> productLineRepository)
        {
            _productLineRepository = productLineRepository;
        }

        public async Task<ProductLine?> Add(ProductLine productline)
        {
            var responce = await _productLineRepository.InsertAsync(productline);
            return responce.Entity;
        }

        public async Task<ProductLine?> Delete(int id)
        {
            var responce = await _productLineRepository.DeleteAsync(id);
            return responce.Entity;
        }

        public Task<IEnumerable<ProductLine?>> GetAll()
        {
            return Task.FromResult<IEnumerable<ProductLine?>>(_productLineRepository.GetAll());
        }

        public Task<ProductLine?> GetById(int id)
        {
            return Task.FromResult<ProductLine?>(_productLineRepository.GetById(id));
        }

        public Task<IEnumerable<ProductLine?>> GetByIds(IEnumerable<int?> ids)
        {
            return Task.FromResult<IEnumerable<ProductLine?>>(_productLineRepository.GetByIds(ids));
        }

        public async Task<ProductLine?> Update(ProductLine productline)
        {
            var responce = await _productLineRepository.UpdateAsync(productline);
            return responce.Entity;
        }
    }
}
