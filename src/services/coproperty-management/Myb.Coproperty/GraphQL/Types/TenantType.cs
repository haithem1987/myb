using HotChocolate;
using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Types;

public class TenantType : ObjectType<Tenant>
{
    protected override void Configure(IObjectTypeDescriptor<Tenant> descriptor)
    {
        descriptor.Field(t => t.Id).Type<NonNullType<IdType>>();
        descriptor.Field(t => t.UnitId).Type<NonNullType<IdType>>();
        descriptor.Field(t => t.FirstName).Type<NonNullType<StringType>>();
        descriptor.Field(t => t.LastName).Type<NonNullType<StringType>>();
        descriptor.Field(t => t.Email).Type<NonNullType<StringType>>();
        descriptor.Field(t => t.Phone).Type<StringType>();
        descriptor.Field(t => t.LeaseStartDate).Type<NonNullType<DateTimeType>>();
        descriptor.Field(t => t.LeaseEndDate).Type<DateTimeType>();
        descriptor.Field(t => t.MonthlyRent).Type<DecimalType>();
        descriptor.Field(t => t.DepositAmount).Type<DecimalType>();
        descriptor.Field(t => t.IsActive).Type<NonNullType<BooleanType>>();
        descriptor.Field(t => t.Notes).Type<StringType>();
        descriptor.Field(t => t.CreatedAt).Type<DateTimeType>();
        descriptor.Field(t => t.UpdatedAt).Type<DateTimeType>();

        descriptor.Field(t => t.Unit)
            .Type<UnitType>()
            .ResolveWith<TenantResolvers>(r => r.GetUnit(default!, default!));
    }

    private class TenantResolvers
    {
        public async Task<Unit?> GetUnit([Parent] Tenant tenant, [Service] IDbContextFactory<CopropertyDbContext> contextFactory)
        {
            await using var context = contextFactory.CreateDbContext();
            return await context.Units
                .Include(u => u.Coproperty)
                .FirstOrDefaultAsync(u => u.Id == tenant.UnitId);
        }
    }
}
