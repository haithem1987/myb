using HotChocolate.Types;
using Myb.Coproperty.Models.Dtos;

namespace Myb.Coproperty.GraphQL.Types;

/// <summary>
/// GraphQL type for DashboardStats
/// </summary>
public class DashboardStatsType : ObjectType<DashboardStats>
{
    protected override void Configure(IObjectTypeDescriptor<DashboardStats> descriptor)
    {
        descriptor.Description("Dashboard statistics for coproperty overview");
        descriptor.Field(x => x.TotalCoproperties).Description("Total number of coproperties");
        descriptor.Field(x => x.TotalUnits).Description("Total number of units");
        descriptor.Field(x => x.TotalBalance).Description("Total outstanding balance");
        descriptor.Field(x => x.TotalCharges).Description("Total charges amount");
        descriptor.Field(x => x.PendingMaintenance).Description("Number of pending maintenance requests");
        descriptor.Field(x => x.OverdueInvoices).Description("Number of overdue invoices");
    }
}
