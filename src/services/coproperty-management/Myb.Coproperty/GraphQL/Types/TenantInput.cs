using HotChocolate.Types;

namespace Myb.Coproperty.GraphQL.Types;

public class TenantInput
{
    public Guid Id { get; set; } = Guid.Empty;
    public Guid UnitId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateTime LeaseStartDate { get; set; } = DateTime.UtcNow;
    public DateTime? LeaseEndDate { get; set; }
    public decimal? MonthlyRent { get; set; }
    public decimal? DepositAmount { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
}

public class TenantInputType : InputObjectType<TenantInput>
{
    protected override void Configure(IInputObjectTypeDescriptor<TenantInput> descriptor)
    {
        descriptor.Field(t => t.Id).Type<IdType>().DefaultValue(Guid.Empty);
        descriptor.Field(t => t.UnitId).Type<NonNullType<IdType>>();
        descriptor.Field(t => t.FirstName).Type<NonNullType<StringType>>();
        descriptor.Field(t => t.LastName).Type<NonNullType<StringType>>();
        descriptor.Field(t => t.Email).Type<NonNullType<StringType>>();
        descriptor.Field(t => t.Phone).Type<StringType>();
        descriptor.Field(t => t.LeaseStartDate).Type<NonNullType<DateTimeType>>();
        descriptor.Field(t => t.LeaseEndDate).Type<DateTimeType>();
        descriptor.Field(t => t.MonthlyRent).Type<DecimalType>();
        descriptor.Field(t => t.DepositAmount).Type<DecimalType>();
        descriptor.Field(t => t.IsActive).Type<NonNullType<BooleanType>>().DefaultValue(true);
        descriptor.Field(t => t.Notes).Type<StringType>();
    }
}
