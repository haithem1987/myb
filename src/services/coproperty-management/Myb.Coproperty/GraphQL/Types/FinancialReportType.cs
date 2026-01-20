using HotChocolate.Types;
using Myb.Coproperty.Models.Dtos;

namespace Myb.Coproperty.GraphQL.Types;

/// <summary>
/// GraphQL type for FinancialReport
/// </summary>
public class FinancialReportType : ObjectType<FinancialReport>
{
    protected override void Configure(IObjectTypeDescriptor<FinancialReport> descriptor)
    {
        descriptor.Description("Financial report for a coproperty");
        descriptor.Field(x => x.CopropertyId).Description("Coproperty ID");
        descriptor.Field(x => x.Year).Description("Report year");
        descriptor.Field(x => x.TotalCharges).Description("Total charges for the year");
        descriptor.Field(x => x.TotalCollected).Description("Total amount collected");
        descriptor.Field(x => x.TotalOverdue).Description("Total overdue amount");
        descriptor.Field(x => x.Balance).Description("Final balance");
        descriptor.Field(x => x.MonthlyBalances).Type<ListType<MonthlyBalanceType>>()
            .Description("Monthly balance details");
    }
}

/// <summary>
/// GraphQL type for MonthlyBalance
/// </summary>
public class MonthlyBalanceType : ObjectType<MonthlyBalance>
{
    protected override void Configure(IObjectTypeDescriptor<MonthlyBalance> descriptor)
    {
        descriptor.Description("Monthly balance data for financial reports");
        descriptor.Field(x => x.Month).Description("Month number (1-12)");
        descriptor.Field(x => x.MonthName).Description("Month name");
        descriptor.Field(x => x.Opening).Description("Opening balance");
        descriptor.Field(x => x.Receipts).Description("Total receipts for the month");
        descriptor.Field(x => x.Expenses).Description("Total expenses for the month");
        descriptor.Field(x => x.Closing).Description("Closing balance");
    }
}
