using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;
using System.Security.Claims;

namespace Myb.Coproperty.GraphQL.Queries;

[ExtendObjectType("Query")]
public class TenantQueries
{
    public async Task<IEnumerable<Tenant>> GetTenants(
        Guid copropertyId,
        ClaimsPrincipal? user,
        [Service] ITenantService tenantService,
        [Service] ICopropertyService copropertyService)
    {
        await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, copropertyId, copropertyService);
        return await tenantService.GetByCopropertyIdAsync(copropertyId);
    }

    public async Task<Tenant> GetTenantById(
        Guid id,
        ClaimsPrincipal? user,
        [Service] ITenantService tenantService,
        [Service] ICopropertyService copropertyService)
    {
        var tenant = await tenantService.GetByIdAsync(id);
        await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, tenant.Unit.CopropertyId, copropertyService);
        return tenant;
    }

    public async Task<IEnumerable<Tenant>> GetTenantsByUnit(
        Guid unitId,
        ClaimsPrincipal? user,
        [Service] ITenantService tenantService,
        [Service] IUnitService unitService,
        [Service] ICopropertyService copropertyService)
    {
        var unit = await unitService.GetByIdAsync(unitId);
        await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, unit.CopropertyId, copropertyService);
        return await tenantService.GetByUnitIdAsync(unitId);
    }
}
