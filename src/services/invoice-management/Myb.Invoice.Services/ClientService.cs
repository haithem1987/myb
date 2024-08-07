using HotChocolate;
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
    public class ClientService : IClientService
    {
        private readonly IGenericRepository<int?, Client, InvoiceContext> _clientRepository;
        private readonly IContactService _contactService;

        public ClientService(IGenericRepository<int?, Client, InvoiceContext> clientRepository, IContactService contactService)
        {
            _clientRepository = clientRepository;
            _contactService = contactService;
        }

        public async Task<Client?> Add(Client client)
        {
            var contacts = client.Contacts;
            client.Contacts = null;
            var responce = await _clientRepository.InsertAsync(client);
            var newClient = responce.Entity;
            List<Contact> contactsList = new List<Contact>();
            foreach (var contact in contacts!)
            {
                contact.ClientID = newClient!.Id;
                var newContact = await _contactService.Add(contact);
                contactsList.Add(newContact);

            }
            newClient.Contacts = contactsList;
            return newClient;
        }

        public async Task<Client?> Delete(int id)
        {
            var responce = await _clientRepository.DeleteAsync(id);
            return responce.Entity;
        }

        public Task<IEnumerable<Client?>> GetAll()
        {
            return Task.FromResult<IEnumerable<Client?>>(_clientRepository.GetAll().Include(C => C.Contacts));
        }

        public Task<Client?> GetById(int? id)
        {
            return Task.FromResult<Client?>(_clientRepository.GetAll().Include(C => C.Contacts).FirstOrDefault(C => C.Id == id));
        }

        public Task<IEnumerable<Client?>> GetByIds(IEnumerable<int?> ids)
        {
            return Task.FromResult<IEnumerable<Client?>>(_clientRepository.GetByIds(ids));
        }

        public async Task<Client?> Update(Client client)
        {
            var responce = await _clientRepository.UpdateAsync(client);
            return responce.Entity;
        }
    }
}
