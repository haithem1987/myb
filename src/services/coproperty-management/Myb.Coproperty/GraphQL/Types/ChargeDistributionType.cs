using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Types
{
    /// <summary>
    /// GraphQL type for ChargeDistribution with extended fields from Unit navigation property
    /// </summary>
    public class ChargeDistributionType : ObjectType<ChargeDistribution>
    {
        protected override void Configure(IObjectTypeDescriptor<ChargeDistribution> descriptor)
        {
            descriptor.Description("Represents the distribution of a charge to a specific unit");

            descriptor
                .Field(d => d.Id)
                .Description("The unique identifier of the charge distribution");

            descriptor
                .Field(d => d.ChargeId)
                .Description("The charge this distribution belongs to");

            descriptor
                .Field(d => d.UnitId)
                .Description("The unit this distribution is for");

            descriptor
                .Field(d => d.Amount)
                .Description("The amount distributed to this unit");

            descriptor
                .Field(d => d.Percentage)
                .Description("The percentage of the total charge");

            descriptor
                .Field(d => d.CalculatedAt)
                .Description("When this distribution was calculated");

            // Add computed fields from Unit navigation property
            descriptor
                .Field("unitNumber")
                .Type<StringType>()
                .Description("The unit number from the related Unit")
                .Resolve(context =>
                {
                    var distribution = context.Parent<ChargeDistribution>();
                    return distribution.Unit?.UnitNumber ?? "N/A";
                });

            descriptor
                .Field("shares")
                .Type<IntType>()
                .Description("The shares from the related Unit")
                .Resolve(context =>
                {
                    var distribution = context.Parent<ChargeDistribution>();
                    return distribution.Unit?.Shares ?? 0;
                });

            descriptor
                .Field("area")
                .Type<FloatType>()
                .Description("The area from the related Unit")
                .Resolve(context =>
                {
                    var distribution = context.Parent<ChargeDistribution>();
                    return distribution.Unit?.Area ?? 0;
                });

            descriptor
                .Field("currency")
                .Type<NonNullType<CurrencyType>>()
                .Description("The currency from the related Charge's Coproperty")
                .ResolveWith<ChargeDistributionResolvers>(r => r.GetCurrency(default!, default!));
        }

        private class ChargeDistributionResolvers
        {
            public Currency GetCurrency([Parent] ChargeDistribution distribution, [Service] CopropertyDbContext context)
            {
                var charge = context.Charges.FirstOrDefault(c => c.Id == distribution.ChargeId);
                if (charge == null) return Currency.EUR;
                
                var coproperty = context.Coproperties.FirstOrDefault(c => c.Id == charge.CopropertyId);
                return coproperty?.Currency ?? Currency.EUR;
            }
        }
    }
}
