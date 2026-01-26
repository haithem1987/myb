using HotChocolate.Types;

namespace Myb.Coproperty.GraphQL.Types
{
    /// <summary>
    /// GraphQL Input Type for CreateChargeInput.
    /// This accepts dates as ISO 8601 strings instead of DateTime objects.
    /// </summary>
    public class CreateChargeInputType : InputObjectType<CreateChargeInput>
    {
        protected override void Configure(IInputObjectTypeDescriptor<CreateChargeInput> descriptor)
        {
            descriptor.Name("CreateChargeInput");
            descriptor.Field(c => c.Id).Type<IdType>().DefaultValue(Guid.Empty);
            descriptor.Field(c => c.CopropertyId).Type<NonNullType<IdType>>();
            descriptor.Field(c => c.Name).Type<NonNullType<StringType>>();
            descriptor.Field(c => c.Description).Type<StringType>();
            descriptor.Field(c => c.ChargeType).Type<NonNullType<StringType>>();
            descriptor.Field(c => c.Frequency).Type<NonNullType<StringType>>();
            descriptor.Field(c => c.TotalAmount).Type<NonNullType<DecimalType>>();
            descriptor.Field(c => c.DistributionMethod).Type<NonNullType<StringType>>();
            descriptor.Field(c => c.StartDate).Type<NonNullType<StringType>>();
            descriptor.Field(c => c.EndDate).Type<StringType>();
            descriptor.Field(c => c.IsActive).Type<BooleanType>().DefaultValue(true);
            descriptor.Field(c => c.CreatedBy).Type<NonNullType<IdType>>();
        }
    }
}
