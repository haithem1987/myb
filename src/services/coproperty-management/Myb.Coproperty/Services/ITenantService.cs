using Myb.Coproperty.Models;

namespace Myb.Coproperty.Services;

public interface ITenantService
{
    Task<Tenant> GetByIdAsync(Guid id);
    Task<IEnumerable<Tenant>> GetByCopropertyIdAsync(Guid copropertyId);
    Task<IEnumerable<Tenant>> GetByUnitIdAsync(Guid unitId);
    Task<Tenant> CreateAsync(Tenant tenant);
    Task<Tenant> UpdateAsync(Tenant tenant);
    Task DeleteAsync(Guid id);
}
