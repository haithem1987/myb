using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Queries;

[ExtendObjectType("Query")]
public class TenantQueries
{
    public async Task<IEnumerable<Tenant>> GetTenants(Guid copropertyId, [Service] ITenantService tenantService) =>
        await tenantService.GetByCopropertyIdAsync(copropertyId);

    public async Task<Tenant> GetTenantById(Guid id, [Service] ITenantService tenantService) =>
        await tenantService.GetByIdAsync(id);

    public async Task<IEnumerable<Tenant>> GetTenantsByUnit(Guid unitId, [Service] ITenantService tenantService) =>
        await tenantService.GetByUnitIdAsync(unitId);
}
