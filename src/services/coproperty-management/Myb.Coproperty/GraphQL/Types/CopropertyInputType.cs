using HotChocolate.Types;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Types
{
    public class CopropertyInputType : InputObjectType<Models.Coproperty>
    {
        protected override void Configure(IInputObjectTypeDescriptor<Models.Coproperty> descriptor)
        {
            // This GraphQL input is a public write contract, not a projection of
            // every persistence field on the entity. In particular, soft-delete
            // and audit fields must remain server-managed. Explicit binding also
            // prevents future entity fields from silently becoming required
            // mutation inputs.
            descriptor.BindFieldsExplicitly();

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
            descriptor.Field(c => c.ManagerId).Type<UuidType>();
            descriptor.Field(c => c.IsActive).Type<BooleanType>().DefaultValue(true);
        }
    }
}
