using HotChocolate.Types;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Types
{
    public class UnitInputType : InputObjectType<Unit>
    {
        protected override void Configure(IInputObjectTypeDescriptor<Unit> descriptor)
        {
            // UnitInput is a public mutation contract. Keep timestamps,
            // navigation properties, and future persistence-only fields
            // server-managed by allowing only the fields listed below.
            descriptor.BindFieldsExplicitly();

            descriptor.Field(u => u.Id).Type<IdType>().DefaultValue(Guid.Empty);
            descriptor.Field(u => u.CopropertyId).Type<NonNullType<IdType>>();
            descriptor.Field(u => u.UnitNumber).Type<NonNullType<StringType>>();
            descriptor.Field(u => u.Floor).Type<IntType>();
            descriptor.Field(u => u.Area).Type<DecimalType>();
            descriptor.Field(u => u.Shares).Type<NonNullType<IntType>>();
            descriptor.Field(u => u.UnitType).Type<StringType>();
            descriptor.Field(u => u.Description).Type<StringType>();
            descriptor.Field(u => u.IsOccupied).Type<BooleanType>().DefaultValue(false);
        }
    }
}
