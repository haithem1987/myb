using HotChocolate.Types;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Types
{
    public class MaintenanceRequestInputType : InputObjectType<MaintenanceRequest>
    {
        protected override void Configure(IInputObjectTypeDescriptor<MaintenanceRequest> descriptor)
        {
            descriptor.Field(m => m.Id).Type<IdType>().DefaultValue(Guid.Empty);
            descriptor.Field(m => m.CopropertyId).Type<NonNullType<IdType>>();
            descriptor.Field(m => m.UnitId).Type<IdType>();
            descriptor.Field(m => m.RequestedBy).Type<NonNullType<IdType>>();
            descriptor.Field(m => m.Title).Type<NonNullType<StringType>>();
            descriptor.Field(m => m.Description).Type<NonNullType<StringType>>();
            descriptor.Field(m => m.Category).Type<NonNullType<StringType>>();
            descriptor.Field(m => m.Priority).Type<NonNullType<StringType>>();
            descriptor.Field(m => m.Status).Type<NonNullType<StringType>>();
            descriptor.Field(m => m.AssignedTo).Type<IdType>();
            descriptor.Field(m => m.EstimatedCost).Type<DecimalType>();
            descriptor.Field(m => m.ActualCost).Type<DecimalType>();
            // Accept dates as ISO 8601 strings
            descriptor.Field(m => m.ScheduledDate)
                .Type<StringType>()
                .Name("scheduledDate");
            descriptor.Field(m => m.CompletedDate)
                .Type<StringType>()
                .Name("completedDate");
            
            // Ignore navigation properties
            descriptor.Ignore(m => m.Coproperty);
            descriptor.Ignore(m => m.Unit);
        }
    }
}
