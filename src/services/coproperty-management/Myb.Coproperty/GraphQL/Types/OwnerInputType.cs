using HotChocolate.Types;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Types
{
    public class OwnerInputType : InputObjectType<Owner>
    {
        protected override void Configure(IInputObjectTypeDescriptor<Owner> descriptor)
        {
            descriptor.Field(o => o.Id).Type<IdType>().DefaultValue(Guid.Empty);
            descriptor.Field(o => o.UserId).Type<NonNullType<IdType>>();
            descriptor.Field(o => o.UnitId).Type<NonNullType<IdType>>();
            descriptor.Field(o => o.FirstName).Type<NonNullType<StringType>>();
            descriptor.Field(o => o.LastName).Type<NonNullType<StringType>>();
            descriptor.Field(o => o.Email).Type<NonNullType<StringType>>();
            descriptor.Field(o => o.Phone).Type<StringType>();
            descriptor.Field(o => o.OwnershipPercentage).Type<NonNullType<DecimalType>>();
            descriptor.Field(o => o.StartDate).Type<NonNullType<DateTimeType>>();
            descriptor.Field(o => o.EndDate).Type<DateTimeType>();
            descriptor.Field(o => o.IsMainOwner).Type<BooleanType>().DefaultValue(true);
            
            // Ignore navigation properties
            descriptor.Ignore(o => o.Unit);
            descriptor.Ignore(o => o.Invoices);
        }
    }
}
