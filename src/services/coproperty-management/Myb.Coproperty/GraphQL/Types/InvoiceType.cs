using HotChocolate.Types;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Types;

/// <summary>
/// GraphQL type for CopropertyInvoice
/// </summary>
public class InvoiceType : ObjectType<CopropertyInvoice>
{
    protected override void Configure(IObjectTypeDescriptor<CopropertyInvoice> descriptor)
    {
        descriptor.Description("Invoice for coproperty charges");
        descriptor.Field(x => x.Id).Type<NonNullType<IdType>>();
        descriptor.Field(x => x.InvoiceNumber).Description("Unique invoice number");
        descriptor.Field(x => x.ChargeId).Description("Associated charge ID");
        descriptor.Field(x => x.UnitId).Description("Unit ID");
        descriptor.Field(x => x.OwnerId).Description("Owner ID");
        descriptor.Field(x => x.Amount).Description("Base amount");
        descriptor.Field(x => x.TaxAmount).Description("Tax amount");
        descriptor.Field(x => x.TotalAmount).Description("Total amount due");
        descriptor.Field(x => x.InvoiceDate).Description("Invoice date");
        descriptor.Field(x => x.DueDate).Description("Payment due date");
        descriptor.Field(x => x.Status).Description("Invoice status");
        descriptor.Field(x => x.PaidDate).Description("Date when fully paid");
        descriptor.Field(x => x.PaymentMethod).Description("Payment method");
        descriptor.Field(x => x.Notes).Description("Invoice notes");
        descriptor.Field(x => x.Payments).Type<ListType<PaymentType>>().Description("Associated payments");
        descriptor.Field(x => x.CreatedBy).Description("User who created the invoice");
        descriptor.Field(x => x.CreatedAt).Description("Creation date");
        descriptor.Field(x => x.UpdatedAt).Description("Last update date");
    }
}
