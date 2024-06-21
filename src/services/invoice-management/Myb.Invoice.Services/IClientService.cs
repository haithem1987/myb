using Myb.Invoice.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.Invoice.Services
{
    public interface IClientService
    {
        Task<Client?> Add(Client client);
        Task<Client?> Update(Client client);
        Task<IEnumerable<Client?>> GetAll();
        Task<IEnumerable<Client?>> GetByIds(IEnumerable<int?> ids);
        Task<Client?> GetById(int id);
        Task<Client?> Delete(int id);
    }
}
