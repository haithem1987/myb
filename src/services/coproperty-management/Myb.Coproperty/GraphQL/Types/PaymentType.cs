using HotChocolate.Types;
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
    }
}
