using HotChocolate.Types;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Types
{
    public class CopropertyInputType : InputObjectType<Models.Coproperty>
    {
        protected override void Configure(IInputObjectTypeDescriptor<Models.Coproperty> descriptor)
        {
            descriptor.Field(c => c.Id).Type<IdType>().DefaultValue(Guid.Empty);
            descriptor.Field(c => c.Name).Type<NonNullType<StringType>>();
            descriptor.Field(c => c.Address).Type<NonNullType<StringType>>();
            descriptor.Field(c => c.City).Type<NonNullType<StringType>>();
            descriptor.Field(c => c.PostalCode).Type<NonNullType<StringType>>();
            descriptor.Field(c => c.Country).Type<NonNullType<StringType>>();
            descriptor.Field(c => c.Currency).Type<CurrencyType>().DefaultValue(Currency.EUR);
            descriptor.Field(c => c.Description).Type<StringType>();
            descriptor.Field(c => c.TotalUnits).Type<NonNullType<IntType>>();
            descriptor.Field(c => c.TotalShares).Type<NonNullType<IntType>>();
            descriptor.Field(c => c.CommonAreas).Type<StringType>();
            descriptor.Field(c => c.ManagerName).Type<StringType>();
            descriptor.Field(c => c.IsActive).Type<BooleanType>().DefaultValue(true);
            
            // Ignore ManagerId from input - we only use ManagerName
            descriptor.Ignore(c => c.ManagerId);
            
            // Ignore navigation properties
            descriptor.Ignore(c => c.Units);
            descriptor.Ignore(c => c.Charges);
            descriptor.Ignore(c => c.MaintenanceRequests);
        }
    }
}
