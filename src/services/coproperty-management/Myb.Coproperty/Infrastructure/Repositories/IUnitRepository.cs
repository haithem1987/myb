using Myb.Coproperty.Models;
using Myb.Common.Repositories;

namespace Myb.Coproperty.Infrastructure.Repositories
{
    public interface IUnitRepository : IGenericRepository<Guid, Unit, Data.CopropertyDbContext>
    {
        Task<IEnumerable<Unit>> GetAllAsync();
        Task<IEnumerable<Unit>> GetByManagerIdAsync(Guid managerId);
        Task<IEnumerable<Unit>> GetByCopropertyIdAsync(Guid copropertyId);
        Task<IEnumerable<Unit>> GetByOwnerIdAsync(Guid ownerId);
    }
}
