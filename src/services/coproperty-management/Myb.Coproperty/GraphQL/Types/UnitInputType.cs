using HotChocolate.Types;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Types
{
    public class UnitInputType : InputObjectType<Unit>
    {
        protected override void Configure(IInputObjectTypeDescriptor<Unit> descriptor)
        {
            descriptor.Field(u => u.Id).Type<IdType>().DefaultValue(Guid.Empty);
            descriptor.Field(u => u.CopropertyId).Type<NonNullType<IdType>>();
            descriptor.Field(u => u.UnitNumber).Type<NonNullType<StringType>>();
            descriptor.Field(u => u.Floor).Type<IntType>();
            descriptor.Field(u => u.Area).Type<DecimalType>();
            descriptor.Field(u => u.Shares).Type<NonNullType<IntType>>();
            descriptor.Field(u => u.UnitType).Type<StringType>();
            descriptor.Field(u => u.Description).Type<StringType>();
            descriptor.Field(u => u.IsOccupied).Type<BooleanType>().DefaultValue(false);
            
            // Ignore navigation properties
            descriptor.Ignore(u => u.Coproperty);
            descriptor.Ignore(u => u.Owners);
            descriptor.Ignore(u => u.ChargeDistributions);
            descriptor.Ignore(u => u.Invoices);
        }
    }
}
