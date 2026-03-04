using Myb.Coproperty.Models;
using Myb.Common.Repositories;

namespace Myb.Coproperty.Infrastructure.Repositories
{
    public interface IOwnerRepository : IGenericRepository<Guid, Owner, Data.CopropertyDbContext>
    {
        Task<Owner?> GetByIdWithUnitsAsync(Guid id);
        Task<Owner?> GetByUserIdAsync(Guid userId);
        Task<IEnumerable<Owner>> GetByUnitIdAsync(Guid unitId);
        Task<IEnumerable<Owner>> GetByCopropertyIdAsync(Guid copropertyId);
    }
}
