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
    public class ContactService : IContactService
    {
        private readonly IGenericRepository<int?, Contact, InvoiceContext> _contactRepository;
        public ContactService(IGenericRepository<int?, Contact, InvoiceContext> contactRepository)
        {
            _contactRepository = contactRepository;
        }

        public async Task<Contact?> Add(Contact contact)
        {
            var responce = await _contactRepository.InsertAsync(contact);
            return responce.Entity;
        }

        public async Task<Contact?> Delete(int id)
        {
            var responce = await _contactRepository.DeleteAsync(id);
            return responce.Entity;
        }

        public Task<IEnumerable<Contact?>> GetAll()
        {
            return Task.FromResult<IEnumerable<Contact?>>(_contactRepository.GetAll());
        }

        public Task<Contact?> GetById(int id)
        {
            return Task.FromResult<Contact?>(_contactRepository.GetById(id));
        }

        public Task<IEnumerable<Contact?>> GetByIds(IEnumerable<int?> ids)
        {
            return Task.FromResult<IEnumerable<Contact?>>(_contactRepository.GetByIds(ids));
        }

        public async Task<Contact?> Update(Contact contact)
        {
            var responce = await _contactRepository.UpdateAsync(contact);
            return responce.Entity;
        }
    }
}
