using Microsoft.EntityFrameworkCore;
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
    public class ProductService : IProductService
    {
        private readonly IGenericRepository<int?, Product, InvoiceContext> _productRepository;

        public ProductService(IGenericRepository<int?, Product, InvoiceContext> productRepository)
        {
            _productRepository = productRepository;
        }

        public async Task<Product?> Add(Product product)
        {
            await _productRepository.InsertAsync(product);
            return await GetById(product.Id);
        }

        public async Task<Product?> Delete(int id)
        {
            var responce = await _productRepository.DeleteAsync(id);
            return responce.Entity;
        }

        public Task<IEnumerable<Product?>> GetAll()
        {
            return Task.FromResult<IEnumerable<Product?>>(_productRepository.GetAll().Include(P => P.Tax));
        }

        public Task<Product?> GetById(int? id)
        {
            return Task.FromResult<Product?>(_productRepository.GetAll().Include(P => P.Tax).FirstOrDefault(P => P.Id == id));
        }

        public Task<IEnumerable<Product?>> GetByIds(IEnumerable<int?> ids)
        {
            return Task.FromResult<IEnumerable<Product?>>(_productRepository.GetByIds(ids));
        }

        public async Task<Product?> Update(Product product)
        {
            var responce = await _productRepository.UpdateAsync(product);
            return responce.Entity;
        }
    }
}
