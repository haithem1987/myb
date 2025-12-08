using Myb.Invoice.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.Invoice.Services
{
    public interface IProductService
    {
        Task<Product?> Add(Product product);
        Task<Product?> Update(Product product);
        Task<IEnumerable<Product?>> GetAll();
        Task<IEnumerable<Product?>> GetByIds(IEnumerable<int?> ids);
        Task<Product?> GetById(int? id);
        Task<Product?> Delete(int id);
    }
}
