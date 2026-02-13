using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Types
{
    public class OwnerUnitType : ObjectType<OwnerUnit>
    {
        protected override void Configure(IObjectTypeDescriptor<OwnerUnit> descriptor)
        {
            descriptor.Field(ou => ou.Id).Type<NonNullType<IdType>>();
            descriptor.Field(ou => ou.OwnerId).Type<NonNullType<IdType>>();
            descriptor.Field(ou => ou.UnitId).Type<NonNullType<IdType>>();
            descriptor.Field(ou => ou.OwnershipPercentage).Type<NonNullType<DecimalType>>();
            descriptor.Field(ou => ou.StartDate).Type<NonNullType<DateTimeType>>();
            descriptor.Field(ou => ou.EndDate).Type<DateTimeType>();
            descriptor.Field(ou => ou.IsMainOwner).Type<NonNullType<BooleanType>>();
            descriptor.Field(ou => ou.CreatedAt).Type<DateTimeType>();
            descriptor.Field(ou => ou.UpdatedAt).Type<DateTimeType>();
            
            // Navigation properties
            descriptor.Field(ou => ou.Owner).Type<OwnerType>();
            descriptor.Field(ou => ou.Unit).Type<UnitType>();
            
            // Currency from the unit's coproperty
            descriptor.Field("currency").ResolveWith<OwnerUnitResolvers>(r => r.GetCurrency(default!, default!)).Type<NonNullType<CurrencyType>>();
        }

        private class OwnerUnitResolvers
        {
            public Currency GetCurrency([Parent] OwnerUnit ownerUnit, [Service] CopropertyDbContext context)
            {
                var unit = context.Units.FirstOrDefault(u => u.Id == ownerUnit.UnitId);
                if (unit == null) return Currency.EUR;
                
                var coproperty = context.Coproperties.FirstOrDefault(c => c.Id == unit.CopropertyId);
                return coproperty?.Currency ?? Currency.EUR;
            }
        }
    }
    
    public class OwnerUnitInputType : InputObjectType<OwnerUnit>
    {
        protected override void Configure(IInputObjectTypeDescriptor<OwnerUnit> descriptor)
        {
            descriptor.Name("OwnerUnitEntityInput");
            descriptor.Field(ou => ou.Id).Type<IdType>().DefaultValue(Guid.Empty);
            descriptor.Field(ou => ou.OwnerId).Type<IdType>();
            descriptor.Field(ou => ou.UnitId).Type<NonNullType<IdType>>();
            descriptor.Field(ou => ou.OwnershipPercentage).Type<DecimalType>().DefaultValue(100.00m);
            descriptor.Field(ou => ou.StartDate).Type<DateTimeType>().DefaultValue(DateTime.UtcNow);
            descriptor.Field(ou => ou.EndDate).Type<DateTimeType>();
            descriptor.Field(ou => ou.IsMainOwner).Type<BooleanType>().DefaultValue(true);
            
            // Ignore navigation properties
            descriptor.Ignore(ou => ou.Owner);
            descriptor.Ignore(ou => ou.Unit);
            descriptor.Ignore(ou => ou.CreatedAt);
            descriptor.Ignore(ou => ou.UpdatedAt);
        }
    }
}
