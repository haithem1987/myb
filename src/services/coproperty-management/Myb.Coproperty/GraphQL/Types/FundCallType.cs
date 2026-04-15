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
            descriptor.Field(f => f.Id).Type<NonNullType<UuidType>>();
            descriptor.Field(f => f.CopropertyId).Type<NonNullType<UuidType>>();
            descriptor.Field(f => f.OwnerId).Type<UuidType>();
            descriptor.Field(f => f.Amount).Type<NonNullType<FloatType>>();
            descriptor.Field(f => f.DueDate).Type<NonNullType<DateTimeType>>();
            descriptor.Field(f => f.Description).Type<StringType>();
            descriptor.Field(f => f.Status)
                .Type<NonNullType<EnumType<FundCallStatus>>>();
            descriptor.Field(f => f.IsActive).Type<NonNullType<BooleanType>>();
            descriptor.Field(f => f.CreatedAt).Type<DateTimeType>();
            descriptor.Field(f => f.UpdatedAt).Type<DateTimeType>();

            // Navigation properties
            descriptor.Field(f => f.Coproperty)
                .ResolveWith<FundCallResolvers>(r => r.GetCoproperty(default!, default!));
            descriptor.Field(f => f.Owner)
                .ResolveWith<FundCallResolvers>(r => r.GetOwner(default!, default!))
                .Type<OwnerType>();
            descriptor.Field(f => f.Payments)
                .ResolveWith<FundCallResolvers>(r => r.GetPayments(default!, default!));

            // Currency from parent coproperty
            descriptor.Field("currency")
                .ResolveWith<FundCallResolvers>(r => r.GetCurrency(default!, default!))
                .Type<NonNullType<CurrencyType>>();
        }

        private class FundCallResolvers
        {
            public Models.Coproperty GetCoproperty([Parent] FundCall fundCall, [Service] CopropertyDbContext context)
                => context.Coproperties.FirstOrDefault(c => c.Id == fundCall.CopropertyId)!;

            public Owner? GetOwner([Parent] FundCall fundCall, [Service] CopropertyDbContext context)
                => fundCall.OwnerId.HasValue
                    ? context.Owners.FirstOrDefault(o => o.Id == fundCall.OwnerId.Value)
                    : null;

            public List<FundCallPayment> GetPayments([Parent] FundCall fundCall, [Service] CopropertyDbContext context)
                => context.FundCallPayments.Where(p => p.FundCallId == fundCall.Id).ToList();

            public Currency GetCurrency([Parent] FundCall fundCall, [Service] CopropertyDbContext context)
            {
                var coproperty = context.Coproperties.FirstOrDefault(c => c.Id == fundCall.CopropertyId);
                return coproperty?.Currency ?? Currency.EUR;
            }
        }
    }

    public class FundCallPaymentType : ObjectType<FundCallPayment>
    {
        protected override void Configure(IObjectTypeDescriptor<FundCallPayment> descriptor)
        {
            descriptor.Field(p => p.Id).Type<NonNullType<UuidType>>();
            descriptor.Field(p => p.FundCallId).Type<NonNullType<UuidType>>();
            descriptor.Field(p => p.Amount).Type<NonNullType<FloatType>>();
            descriptor.Field(p => p.PaymentDate).Type<NonNullType<DateTimeType>>();
            descriptor.Field(p => p.Justificatif).Type<StringType>();
            descriptor.Field(p => p.PaymentMethod).Type<StringType>();
            descriptor.Field(p => p.CreatedAt).Type<NonNullType<DateTimeType>>();
        }
    }
}
