using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using HotChocolate;
using HotChocolate.Types;

namespace Myb.Coproperty.GraphQL.Types
{
    public class OwnerType : ObjectType<Owner>
    {
        protected override void Configure(IObjectTypeDescriptor<Owner> descriptor)
        {
            descriptor.Field(o => o.Id).Type<NonNullType<IdType>>();
            descriptor.Field(o => o.Unit).ResolveWith<OwnerResolvers>(r => r.GetUnit(default!, default!));
        }

        private class OwnerResolvers
        {
            public Unit GetUnit([Parent] Owner owner, [Service] CopropertyDbContext context)
            {
                return context.Units.FirstOrDefault(u => u.Id == owner.UnitId);
            }
        }
    }
}
