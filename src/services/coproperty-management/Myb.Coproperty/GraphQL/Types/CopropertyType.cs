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
            descriptor.Field(c => c.Id).Type<NonNullType<IdType>>();
            descriptor.Field(c => c.Name).Type<NonNullType<StringType>>();
            descriptor.Field(c => c.Units).ResolveWith<CopropertyResolvers>(r => r.GetUnits(default!, default!));
            descriptor.Field(c => c.Charges).ResolveWith<CopropertyResolvers>(r => r.GetCharges(default!, default!));
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
