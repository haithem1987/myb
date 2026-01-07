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
            descriptor.Field(u => u.Owners).ResolveWith<UnitResolvers>(r => r.GetOwners(default!, default!));
        }

        private class UnitResolvers
        {
            public Models.Coproperty GetCoproperty([Parent] Unit unit, [Service] CopropertyDbContext context)
            {
                return context.Coproperties.FirstOrDefault(c => c.Id == unit.CopropertyId);
            }

            public IQueryable<Owner> GetOwners([Parent] Unit unit, [Service] CopropertyDbContext context)
            {
                return context.Owners.Where(o => o.UnitId == unit.Id);
            }
        }
    }
}
