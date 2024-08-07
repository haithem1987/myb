using Myb.Invoice.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.Invoice.Services
{
    public interface ITaxService
    {
        Task<Tax?> Add(Tax tax);
        Task<Tax?> Update(Tax tax);
        Task<IEnumerable<Tax?>> GetAll();
        Task<IEnumerable<Tax?>> GetByIds(IEnumerable<int?> ids);
        Task<Tax?> GetById(int id);
        Task<Tax?> Delete(int id);
    }
}
