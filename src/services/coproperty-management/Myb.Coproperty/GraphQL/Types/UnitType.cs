using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using HotChocolate;
using HotChocolate.Types;

namespace Myb.Coproperty.GraphQL.Types
{
    public class UnitType : ObjectType<Unit>
    {
        protected override void Configure(IObjectTypeDescriptor<Unit> descriptor)
        {
            descriptor.Field(u => u.Id).Type<NonNullType<IdType>>();
            descriptor.Field(u => u.Coproperty).ResolveWith<UnitResolvers>(r => r.GetCoproperty(default!, default!));
            descriptor.Field(u => u.OwnerUnits).ResolveWith<UnitResolvers>(r => r.GetOwnerUnits(default!, default!));
            descriptor.Field("currency").ResolveWith<UnitResolvers>(r => r.GetCurrency(default!, default!)).Type<NonNullType<CurrencyType>>();
            descriptor.Field("copropertyName").ResolveWith<UnitResolvers>(r => r.GetCopropertyName(default!, default!)).Type<StringType>();
        }

        private class UnitResolvers
        {
            public Models.Coproperty GetCoproperty([Parent] Unit unit, [Service] CopropertyDbContext context)
            {
                return context.Coproperties.FirstOrDefault(c => c.Id == unit.CopropertyId);
            }

            public IQueryable<OwnerUnit> GetOwnerUnits([Parent] Unit unit, [Service] CopropertyDbContext context)
            {
                return context.OwnerUnits.Where(ou => ou.UnitId == unit.Id);
            }

            public Currency GetCurrency([Parent] Unit unit, [Service] CopropertyDbContext context)
            {
                var coproperty = context.Coproperties.FirstOrDefault(c => c.Id == unit.CopropertyId);
                return coproperty?.Currency ?? Currency.EUR;
            }

            public string? GetCopropertyName([Parent] Unit unit, [Service] CopropertyDbContext context)
            {
                // Use the already loaded Coproperty navigation property if available
                if (unit.Coproperty != null)
                {
                    return unit.Coproperty.Name;
                }
                
                // Otherwise query the database
                var coproperty = context.Coproperties.FirstOrDefault(c => c.Id == unit.CopropertyId);
                return coproperty?.Name;
            }
        }
    }
}
