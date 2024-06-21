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
        public ClientService(IGenericRepository<int?, Client, InvoiceContext> clientRepository)
        {
            _clientRepository = clientRepository;
        }

        public async Task<Client?> Add(Client client)
        {
            var responce = await _clientRepository.InsertAsync(client);
            return responce.Entity;
        }

        public async Task<Client?> Delete(int id)
        {
            var responce = await _clientRepository.DeleteAsync(id);
            return responce.Entity;
        }

        public Task<IEnumerable<Client?>> GetAll()
        {
            return Task.FromResult<IEnumerable<Client?>>(_clientRepository.GetAll());
        }

        public Task<Client?> GetById(int id)
        {
            return Task.FromResult<Client?>(_clientRepository?.GetById(id));
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
