using Myb.Coproperty.Models;
using Myb.Common.Repositories;

namespace Myb.Coproperty.Infrastructure.Repositories
{
    public interface IChargeRepository : IGenericRepository<Guid, Charge, Data.CopropertyDbContext>
    {
        Task<IEnumerable<Charge>> GetAllAsync();
        Task<IEnumerable<Charge>> GetActiveChargesAsync(Guid copropertyId);
    }
}
