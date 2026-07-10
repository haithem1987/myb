using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.GraphQL.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class TenantMutations
{
    public async Task<Tenant> CreateTenant(TenantInput input, [Service] ITenantService tenantService)
    {
        var tenant = MapTenant(input);
        return await tenantService.CreateAsync(tenant);
    }

    public async Task<Tenant> UpdateTenant(Guid id, TenantInput input, [Service] ITenantService tenantService)
    {
        var tenant = MapTenant(input);
        tenant.Id = id;
        return await tenantService.UpdateAsync(tenant);
    }

    public async Task<bool> RemoveTenant(Guid id, [Service] ITenantService tenantService)
    {
        await tenantService.DeleteAsync(id);
        return true;
    }

    private static Tenant MapTenant(TenantInput input)
    {
        return new Tenant
        {
            Id = input.Id == Guid.Empty ? Guid.NewGuid() : input.Id,
            UnitId = input.UnitId,
            FirstName = input.FirstName,
            LastName = input.LastName,
            Email = input.Email,
            Phone = input.Phone,
            LeaseStartDate = input.LeaseStartDate,
            LeaseEndDate = input.LeaseEndDate,
            MonthlyRent = input.MonthlyRent,
            DepositAmount = input.DepositAmount,
            IsActive = input.IsActive,
            Notes = input.Notes
        };
    }
}
