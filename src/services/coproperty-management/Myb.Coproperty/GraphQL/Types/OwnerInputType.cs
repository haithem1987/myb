using HotChocolate.Types;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Types
{
    public class OwnerInputType : InputObjectType<Owner>
    {
        protected override void Configure(IInputObjectTypeDescriptor<Owner> descriptor)
        {
            // Keep audit/soft-delete and navigation fields out of the public
            // mutation contract. Without explicit binding, adding a non-nullable
            // entity property (such as IsDeleted) makes it a required GraphQL
            // input field and breaks existing clients.
            descriptor.BindFieldsExplicitly();

            descriptor.Field(o => o.Id).Type<IdType>().DefaultValue(Guid.Empty);
            descriptor.Field(o => o.UserId).Type<NonNullType<IdType>>();
            descriptor.Field(o => o.FirstName).Type<NonNullType<StringType>>();
            descriptor.Field(o => o.LastName).Type<NonNullType<StringType>>();
            descriptor.Field(o => o.Email).Type<NonNullType<StringType>>();
            descriptor.Field(o => o.Phone).Type<StringType>();
        }
    }
}
