using Myb.Common.Repositories;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.Infrastructure.Repositories;

public interface ITenantRepository : IGenericRepository<Guid, Tenant, Data.CopropertyDbContext>
{
    Task<Tenant?> GetByIdWithUnitAsync(Guid id);
    Task<IEnumerable<Tenant>> GetByCopropertyIdAsync(Guid copropertyId);
    Task<IEnumerable<Tenant>> GetByUnitIdAsync(Guid unitId);
    Task<Tenant?> GetActiveByUnitIdAsync(Guid unitId);
    Task<Tenant> UpdateTenantAsync(Tenant tenant);
}
