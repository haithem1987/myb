using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using HotChocolate;
using HotChocolate.Types;

namespace Myb.Coproperty.GraphQL.Types
{
    public class ChargeType : ObjectType<Charge>
    {
        protected override void Configure(IObjectTypeDescriptor<Charge> descriptor)
        {
            descriptor.Field(c => c.Id).Type<NonNullType<IdType>>();
            descriptor.Field(c => c.Coproperty).ResolveWith<ChargeResolvers>(r => r.GetCoproperty(default!, default!));
            descriptor.Field(c => c.Distributions).ResolveWith<ChargeResolvers>(r => r.GetDistributions(default!, default!));
        }

        private class ChargeResolvers
        {
            public Models.Coproperty GetCoproperty([Parent] Charge charge, [Service] CopropertyDbContext context)
            {
                return context.Coproperties.FirstOrDefault(c => c.Id == charge.CopropertyId);
            }

            public IQueryable<ChargeDistribution> GetDistributions([Parent] Charge charge, [Service] CopropertyDbContext context)
            {
                return context.ChargeDistributions.Where(d => d.ChargeId == charge.Id);
            }
        }
    }
}
