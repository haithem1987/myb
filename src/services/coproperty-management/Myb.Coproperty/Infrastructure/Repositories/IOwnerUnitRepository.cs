using Myb.Coproperty.Models;
using Myb.Common.Repositories;

namespace Myb.Coproperty.Infrastructure.Repositories
{
    public interface IOwnerUnitRepository : IGenericRepository<Guid, OwnerUnit, Data.CopropertyDbContext>
    {
        Task<IEnumerable<OwnerUnit>> GetByOwnerIdAsync(Guid ownerId);
        Task<IEnumerable<OwnerUnit>> GetByUnitIdAsync(Guid unitId);
    }
}
