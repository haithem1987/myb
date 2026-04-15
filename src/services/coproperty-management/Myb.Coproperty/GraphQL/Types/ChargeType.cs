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
            descriptor.Field(c => c.IsContribution).Type<NonNullType<BooleanType>>();
            descriptor.Field(c => c.Coproperty).ResolveWith<ChargeResolvers>(r => r.GetCoproperty(default!, default!));
            descriptor.Field(c => c.Distributions).ResolveWith<ChargeResolvers>(r => r.GetDistributions(default!, default!));
            descriptor.Field("currency").ResolveWith<ChargeResolvers>(r => r.GetCurrency(default!, default!)).Type<NonNullType<CurrencyType>>();
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

            public Currency GetCurrency([Parent] Charge charge, [Service] CopropertyDbContext context)
            {
                var coproperty = context.Coproperties.FirstOrDefault(c => c.Id == charge.CopropertyId);
                return coproperty?.Currency ?? Currency.EUR;
            }
        }
    }
}
