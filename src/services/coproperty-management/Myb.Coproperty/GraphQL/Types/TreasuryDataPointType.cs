using HotChocolate.Types;
using Myb.Coproperty.Models.Dtos;

namespace Myb.Coproperty.GraphQL.Types;

/// <summary>
/// GraphQL type for TreasuryDataPoint
/// </summary>
public class TreasuryDataPointType : ObjectType<TreasuryDataPoint>
{
    protected override void Configure(IObjectTypeDescriptor<TreasuryDataPoint> descriptor)
    {
        descriptor.Description("Data point for treasury evolution chart");
        descriptor.Field(x => x.Month).Description("Month label (e.g., 'January 2024')");
        descriptor.Field(x => x.Date).Description("Date of the data point");
        descriptor.Field(x => x.Amount).Description("Amount for the month");
    }
}
