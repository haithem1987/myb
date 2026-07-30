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

            // Payment tracking fields
            descriptor
                .Field(d => d.PaymentStatus)
                .Description("Payment status: Unpaid, Pending, Paid, PartiallyPaid, Failed");

            descriptor
                .Field(d => d.PaidAmount)
                .Description("Total amount paid so far");

            descriptor
                .Field(d => d.PaidAt)
                .Description("Date when the payment was made");

            descriptor
                .Field(d => d.PaymentTransactionId)
                .Description("Transaction ID from the payment service");

            descriptor
                .Field(d => d.PaymentMethod)
                .Description("Payment method used (Card, BankTransfer, etc.)");

            // Charge details for owner display
            descriptor
                .Field("chargeName")
                .Type<StringType>()
                .Description("The name of the charge")
                .Resolve(context =>
                {
                    var distribution = context.Parent<ChargeDistribution>();
                    return distribution.Charge?.Name ?? "";
                });

            descriptor
                .Field("chargeDescription")
                .Type<StringType>()
                .Description("The description of the charge")
                .Resolve(context =>
                {
                    var distribution = context.Parent<ChargeDistribution>();
                    return distribution.Charge?.Description ?? "";
                });

            descriptor
                .Field("chargeType")
                .Type<StringType>()
                .Description("The type of charge (CLEANING, MAINTENANCE, etc.)")
                .Resolve(context =>
                {
                    var distribution = context.Parent<ChargeDistribution>();
                    return distribution.Charge?.ChargeType.ToString() ?? "";
                });

            descriptor
                .Field("chargeFrequency")
                .Type<StringType>()
                .Description("The frequency/year of the charge")
                .Resolve(context =>
                {
                    var distribution = context.Parent<ChargeDistribution>();
                    return distribution.Charge?.Frequency ?? "";
                });

            // Owner name for syndic view
            descriptor
                .Field("ownerName")
                .Type<StringType>()
                .Description("Name of the owner of this unit")
                .Resolve(context =>
                {
                    var distribution = context.Parent<ChargeDistribution>();
                    var owner = distribution.Unit?.OwnerUnits?.FirstOrDefault(ou => ou.EndDate == null)?.Owner;
                    if (owner != null)
                        return $"{owner.FirstName} {owner.LastName}";
                    return "Non assigné";
                });

            descriptor
                .Field("ownerEmail")
                .Type<StringType>()
                .Description("Email of the owner of this unit")
                .Resolve(context =>
                {
                    var distribution = context.Parent<ChargeDistribution>();
                    var owner = distribution.Unit?.OwnerUnits?.FirstOrDefault(ou => ou.EndDate == null)?.Owner;
                    return owner?.Email ?? "";
                });
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
