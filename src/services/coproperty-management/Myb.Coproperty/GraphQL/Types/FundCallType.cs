using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Types
{
    public class FundCallType : ObjectType<FundCall>
    {
        protected override void Configure(IObjectTypeDescriptor<FundCall> descriptor)
        {
            descriptor.Field(f => f.Id).Type<NonNullType<IdType>>();
            descriptor.Field(f => f.CopropertyId).Type<NonNullType<IdType>>();
            descriptor.Field(f => f.Amount).Type<NonNullType<DecimalType>>();
            descriptor.Field(f => f.DueDate).Type<NonNullType<DateTimeType>>();
            descriptor.Field(f => f.Description).Type<StringType>();
            descriptor.Field(f => f.IsActive).Type<NonNullType<BooleanType>>();
            descriptor.Field(f => f.CreatedAt).Type<DateTimeType>();
            descriptor.Field(f => f.UpdatedAt).Type<DateTimeType>();
            
            // Navigation properties
            descriptor.Field(f => f.Coproperty).ResolveWith<FundCallResolvers>(r => r.GetCoproperty(default!, default!));
            
            // Currency from parent coproperty
            descriptor.Field("currency").ResolveWith<FundCallResolvers>(r => r.GetCurrency(default!, default!)).Type<NonNullType<CurrencyType>>();
        }

        private class FundCallResolvers
        {
            public Models.Coproperty GetCoproperty([Parent] FundCall fundCall, [Service] CopropertyDbContext context)
            {
                return context.Coproperties.FirstOrDefault(c => c.Id == fundCall.CopropertyId);
            }

            public Currency GetCurrency([Parent] FundCall fundCall, [Service] CopropertyDbContext context)
            {
                var coproperty = context.Coproperties.FirstOrDefault(c => c.Id == fundCall.CopropertyId);
                return coproperty?.Currency ?? Currency.EUR;
            }
        }
    }
}
