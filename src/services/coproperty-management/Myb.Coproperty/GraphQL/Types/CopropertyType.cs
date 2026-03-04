using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using HotChocolate;
using HotChocolate.Types;

namespace Myb.Coproperty.GraphQL.Types
{
    public class CopropertyType : ObjectType<Models.Coproperty>
    {
        protected override void Configure(IObjectTypeDescriptor<Models.Coproperty> descriptor)
        {
            // Expose all scalar fields automatically
            descriptor.Field(c => c.Id).Type<NonNullType<UuidType>>();
            descriptor.Field(c => c.Name).Type<NonNullType<StringType>>();
            descriptor.Field(c => c.Address).Type<NonNullType<StringType>>();
            descriptor.Field(c => c.City).Type<NonNullType<StringType>>();
            descriptor.Field(c => c.PostalCode).Type<NonNullType<StringType>>();
            descriptor.Field(c => c.Country).Type<NonNullType<StringType>>();
            descriptor.Field(c => c.Currency).Type<NonNullType<CurrencyType>>();
            descriptor.Field(c => c.Description).Type<StringType>();
            descriptor.Field(c => c.TotalUnits).Type<NonNullType<IntType>>();
            descriptor.Field(c => c.TotalShares).Type<NonNullType<IntType>>();
            descriptor.Field(c => c.CommonAreas).Type<StringType>();
            descriptor.Field(c => c.ManagerName).Type<StringType>();
            descriptor.Field(c => c.ManagerId).Type<UuidType>();
            descriptor.Field(c => c.IsActive).Type<NonNullType<BooleanType>>();
            descriptor.Field(c => c.CreatedAt).Type<DateTimeType>();
            descriptor.Field(c => c.UpdatedAt).Type<DateTimeType>();
            
            // Custom resolvers for navigation properties
            descriptor.Field(c => c.Units).ResolveWith<CopropertyResolvers>(r => r.GetUnits(default!, default!));
            descriptor.Field(c => c.Charges).ResolveWith<CopropertyResolvers>(r => r.GetCharges(default!, default!));
            
            // Ignore navigation property
            descriptor.Ignore(c => c.MaintenanceRequests);
        }

        private class CopropertyResolvers
        {
            public IQueryable<Unit> GetUnits([Parent] Models.Coproperty coproperty, [Service] CopropertyDbContext context)
            {
                return context.Units.Where(u => u.CopropertyId == coproperty.Id);
            }

            public IQueryable<Charge> GetCharges([Parent] Models.Coproperty coproperty, [Service] CopropertyDbContext context)
            {
                return context.Charges.Where(c => c.CopropertyId == coproperty.Id);
            }
        }
    }
}
