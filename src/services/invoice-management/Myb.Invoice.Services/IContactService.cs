using Myb.Invoice.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Myb.Invoice.Services
{
    public interface IContactService
    {
        Task<Contact?> Add(Contact contact);
        Task<Contact?> Update(Contact contact);
        Task<IEnumerable<Contact?>> GetAll();
        Task<IEnumerable<Contact?>> GetByIds(IEnumerable<int?> ids);
        Task<Contact?> GetById(int id);
        Task<Contact?> Delete(int id);
    }
}
