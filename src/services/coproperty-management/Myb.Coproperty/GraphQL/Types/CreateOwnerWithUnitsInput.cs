using HotChocolate.Types;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Types
{
    /// <summary>
    /// Input type for creating or updating an owner with multiple units
    /// </summary>
    public class CreateOwnerWithUnitsInput
    {
        public Guid Id { get; set; } = Guid.Empty;
        public Guid UserId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public List<OwnerUnitInput> Units { get; set; } = new List<OwnerUnitInput>();
    }
    
    public class OwnerUnitInput
    {
        public Guid UnitId { get; set; }
        public decimal OwnershipPercentage { get; set; } = 100.00m;
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime? EndDate { get; set; }
        public bool IsMainOwner { get; set; } = true;
    }
    
    public class CreateOwnerWithUnitsInputType : InputObjectType<CreateOwnerWithUnitsInput>
    {
        protected override void Configure(IInputObjectTypeDescriptor<CreateOwnerWithUnitsInput> descriptor)
        {
            descriptor.Field(o => o.Id).Type<IdType>().DefaultValue(Guid.Empty);
            descriptor.Field(o => o.UserId).Type<NonNullType<IdType>>();
            descriptor.Field(o => o.FirstName).Type<NonNullType<StringType>>();
            descriptor.Field(o => o.LastName).Type<NonNullType<StringType>>();
            descriptor.Field(o => o.Email).Type<NonNullType<StringType>>();
            descriptor.Field(o => o.Phone).Type<StringType>();
            descriptor.Field(o => o.Units).Type<NonNullType<ListType<NonNullType<OwnerUnitInputTypeInternal>>>>();
        }
    }
    
    public class OwnerUnitInputTypeInternal : InputObjectType<OwnerUnitInput>
    {
        protected override void Configure(IInputObjectTypeDescriptor<OwnerUnitInput> descriptor)
        {
            descriptor.Name("OwnerUnitInput");
            descriptor.Field(ou => ou.UnitId).Type<NonNullType<IdType>>();
            descriptor.Field(ou => ou.OwnershipPercentage).Type<DecimalType>().DefaultValue(100.00m);
            descriptor.Field(ou => ou.StartDate).Type<DateTimeType>().DefaultValue(DateTime.UtcNow);
            descriptor.Field(ou => ou.EndDate).Type<DateTimeType>();
            descriptor.Field(ou => ou.IsMainOwner).Type<BooleanType>().DefaultValue(true);
        }
    }
}
