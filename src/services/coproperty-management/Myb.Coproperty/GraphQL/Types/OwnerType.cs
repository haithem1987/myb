using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using Microsoft.EntityFrameworkCore;

namespace Myb.Coproperty.GraphQL.Types
{
    public class OwnerType : ObjectType<Owner>
    {
        protected override void Configure(IObjectTypeDescriptor<Owner> descriptor)
        {
            descriptor.Field(o => o.Id).Type<NonNullType<IdType>>();
            descriptor.Field(o => o.UserId).Type<NonNullType<IdType>>();
            descriptor.Field(o => o.FirstName).Type<NonNullType<StringType>>();
            descriptor.Field(o => o.LastName).Type<NonNullType<StringType>>();
            descriptor.Field(o => o.Email).Type<NonNullType<StringType>>();
            descriptor.Field(o => o.Phone).Type<StringType>();
            descriptor.Field(o => o.CreatedAt).Type<DateTimeType>();
            descriptor.Field(o => o.UpdatedAt).Type<DateTimeType>();
            
            // Navigation properties
            descriptor.Field(o => o.OwnerUnits)
                .Type<ListType<OwnerUnitType>>()
                .ResolveWith<OwnerResolvers>(r => r.GetOwnerUnits(default!, default!));
            
            // Backward compatibility - deprecated field
            descriptor.Field("unit")
                .Type<UnitType>()
                .Deprecated("Use ownerUnits instead")
                .ResolveWith<OwnerResolvers>(r => r.GetUnit(default!, default!));
            
            descriptor.Field("unitId")
                .Type<IdType>()
                .Deprecated("Use ownerUnits instead")
                .Resolve(ctx => {
                    var owner = ctx.Parent<Owner>();
                    #pragma warning disable CS0618
                    return owner.UnitId;
                    #pragma warning restore CS0618
                });
            
            // Ignore deprecated navigation properties
            descriptor.Ignore(o => o.Invoices);
        }

        private class OwnerResolvers
        {
            public async Task<List<OwnerUnit>> GetOwnerUnits([Parent] Owner owner, [Service] CopropertyDbContext context)
            {
                return await context.OwnerUnits
                    .Include(ou => ou.Unit)
                    .Where(ou => ou.OwnerId == owner.Id)
                    .ToListAsync();
            }
            
            public async Task<Unit?> GetUnit([Parent] Owner owner, [Service] CopropertyDbContext context)
            {
                var firstOwnerUnit = await context.OwnerUnits
                    .Include(ou => ou.Unit)
                    .Where(ou => ou.OwnerId == owner.Id)
                    .FirstOrDefaultAsync();
                    
                return firstOwnerUnit?.Unit;
            }
        }
    }
}
