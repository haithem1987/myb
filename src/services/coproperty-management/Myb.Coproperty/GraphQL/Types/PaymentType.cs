using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Types;

/// <summary>
/// GraphQL type for Payment
/// </summary>
public class PaymentType : ObjectType<Payment>
{
    protected override void Configure(IObjectTypeDescriptor<Payment> descriptor)
    {
        descriptor.Description("Payment record for an invoice");
        descriptor.Field(x => x.Id).Type<NonNullType<IdType>>();
        descriptor.Field(x => x.InvoiceId).Description("Invoice ID");
        descriptor.Field(x => x.Amount).Description("Payment amount");
        descriptor.Field(x => x.PaymentDate).Description("Payment date");
        descriptor.Field(x => x.PaymentMethod).Description("Payment method (e.g., bank transfer, check)");
        descriptor.Field(x => x.TransactionId).Description("Transaction reference");
        descriptor.Field(x => x.Notes).Description("Payment notes");
        descriptor.Field(x => x.CreatedBy).Description("User who recorded the payment");
        descriptor.Field(x => x.CreatedAt).Description("Payment creation date");
        descriptor.Field("currency").ResolveWith<PaymentResolvers>(r => r.GetCurrency(default!, default!)).Type<NonNullType<CurrencyType>>().Description("Currency from the associated invoice's coproperty");
    }

    private class PaymentResolvers
    {
        public Currency GetCurrency([Parent] Payment payment, [Service] CopropertyDbContext context)
        {
            var invoice = context.CopropertyInvoices.FirstOrDefault(i => i.Id == payment.InvoiceId);
            if (invoice == null) return Currency.EUR;
            
            var charge = context.Charges.FirstOrDefault(c => c.Id == invoice.ChargeId);
            if (charge == null) return invoice.CurrencySnapshot;
            
            var coproperty = context.Coproperties.FirstOrDefault(c => c.Id == charge.CopropertyId);
            return coproperty?.Currency ?? invoice.CurrencySnapshot;
        }
    }
}
