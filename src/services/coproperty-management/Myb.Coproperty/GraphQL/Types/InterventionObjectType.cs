using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Types;

public class InterventionObjectType : ObjectType<Intervention>
{
    protected override void Configure(IObjectTypeDescriptor<Intervention> descriptor)
    {
        descriptor.Name("Intervention");
        descriptor.Field(i => i.Id).Type<NonNullType<UuidType>>();
        descriptor.Field(i => i.CopropertyId).Type<NonNullType<UuidType>>();
        descriptor.Field(i => i.UnitId).Type<UuidType>();
        descriptor.Field(i => i.Title).Type<NonNullType<StringType>>();
        descriptor.Field(i => i.Description).Type<NonNullType<StringType>>();
        descriptor.Field(i => i.InterventionType).Type<NonNullType<InterventionTypeEnumType>>();
        descriptor.Field(i => i.Priority).Type<NonNullType<EnumType<Priority>>>();
        descriptor.Field(i => i.Status).Type<NonNullType<EnumType<InterventionStatus>>>();
        descriptor.Field(i => i.ProviderName).Type<StringType>();
        descriptor.Field(i => i.ProviderPhone).Type<StringType>();
        descriptor.Field(i => i.ProviderEmail).Type<StringType>();
        descriptor.Field(i => i.AssignedTo).Type<UuidType>();
        descriptor.Field(i => i.RequestedBy).Type<UuidType>();
        descriptor.Field(i => i.EstimatedCost).Type<DecimalType>();
        descriptor.Field(i => i.ActualCost).Type<DecimalType>();
        descriptor.Field(i => i.PlannedDate).Type<DateTimeType>();
        descriptor.Field(i => i.StartedDate).Type<DateTimeType>();
        descriptor.Field(i => i.CompletedDate).Type<DateTimeType>();
        descriptor.Field(i => i.Notes).Type<StringType>();
        descriptor.Field(i => i.Resolution).Type<StringType>();
        descriptor.Field(i => i.MaintenanceRequestId).Type<UuidType>();
        descriptor.Field(i => i.CreatedAt).Type<DateTimeType>();
        descriptor.Field(i => i.UpdatedAt).Type<DateTimeType>();

        // Computed currency field from coproperty
        descriptor.Field("currency")
            .Type<CurrencyType>()
            .ResolveWith<InterventionResolvers>(r => r.GetCurrency(default!, default!));

        // Navigation resolvers
        descriptor.Field(i => i.Coproperty)
            .ResolveWith<InterventionResolvers>(r => r.GetCoproperty(default!, default!));
        descriptor.Field(i => i.Unit)
            .ResolveWith<InterventionResolvers>(r => r.GetUnit(default!, default!));

        descriptor.Ignore(i => i.MaintenanceRequest);
    }

    private class InterventionResolvers
    {
        [GraphQLType(typeof(CurrencyType))]
        public Currency? GetCurrency([Parent] Intervention intervention, [Service] CopropertyDbContext context)
        {
            var coproperty = context.Coproperties.FirstOrDefault(c => c.Id == intervention.CopropertyId);
            return coproperty?.Currency;
        }

        [GraphQLType(typeof(CopropertyType))]
        public Models.Coproperty? GetCoproperty([Parent] Intervention intervention, [Service] CopropertyDbContext context)
        {
            return context.Coproperties.FirstOrDefault(c => c.Id == intervention.CopropertyId);
        }

        [GraphQLType(typeof(UnitType))]
        public Unit? GetUnit([Parent] Intervention intervention, [Service] CopropertyDbContext context)
        {
            if (intervention.UnitId == null) return null;
            return context.Units.FirstOrDefault(u => u.Id == intervention.UnitId);
        }
    }
}
