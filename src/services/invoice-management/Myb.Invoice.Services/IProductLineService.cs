using Myb.Invoice.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.Invoice.Services
{
    public interface IProductLineService
    {
        Task<ProductLine?> Add(ProductLine productline);
        Task<ProductLine?> Update(ProductLine productline);
        Task<IEnumerable<ProductLine?>> GetAll();
        Task<IEnumerable<ProductLine?>> GetByIds(IEnumerable<int?> ids);
        Task<ProductLine?> GetById(int id);
        Task<ProductLine?> Delete(int id);
    }
}
