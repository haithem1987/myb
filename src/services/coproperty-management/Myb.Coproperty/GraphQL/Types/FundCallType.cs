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

            // Server-side single source of truth for the delete precondition
            // (FRS-FCF-LCM-2026-001 §2.1 / §3.2.3). The UI must consult this
            // flag instead of recomputing the rule client-side.
            // Computed inline from the parent entity (no [Service] injection in
            // the resolver — that pattern broke the Hot Chocolate 12 schema
            // builder with "Unable to infer or resolve a schema type from the
            // type reference IValueNode (Input)").
            descriptor.Field("deletable")
                .Resolve(ctx => FundCallLifecycleHelpers.IsDeletable(ctx.Parent<FundCall>()))
                .Type<NonNullType<BooleanType>>()
                .Description("True only for true drafts (TO_PAY, no payments, no invoices, ≤30 days old).");

            // Server-side cancellation guard. A fund call that is already
            // cancelled has no "Cancel" affordance, so the UI uses this flag
            // to hide the action.
            descriptor.Field("cancellable")
                .Resolve(ctx => FundCallLifecycleHelpers.IsCancellable(ctx.Parent<FundCall>()))
                .Type<NonNullType<BooleanType>>()
                .Description("True when the fund call is in any state except the terminal CANCELLED state.");

            // French reason why a delete is blocked, surfaced by the UI to
            // explain why the Supprimer button is not shown.
            descriptor.Field("deleteBlockerReason")
                .Resolve(ctx => FundCallLifecycleHelpers.GetDeleteBlockerReason(ctx.Parent<FundCall>()))
                .Type<StringType>()
                .Description("French reason why a hard delete is blocked; null when the row is deletable.");

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

            // Historical-data preservation: fall back to the snapshot captured at
            // creation time when the related Coproperty/Owner has since been deleted.
            descriptor.Field("copropertyName")
                .ResolveWith<FundCallResolvers>(r => r.GetCopropertyName(default!, default!))
                .Type<StringType>();
            descriptor.Field("ownerName")
                .ResolveWith<FundCallResolvers>(r => r.GetOwnerName(default!, default!))
                .Type<StringType>();
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

            public string? GetCopropertyName([Parent] FundCall fundCall, [Service] CopropertyDbContext context)
            {
                var coproperty = context.Coproperties.FirstOrDefault(c => c.Id == fundCall.CopropertyId);
                return coproperty?.Name ?? fundCall.CopropertyNameSnapshot;
            }

            public string? GetOwnerName([Parent] FundCall fundCall, [Service] CopropertyDbContext context)
            {
                if (fundCall.OwnerId.HasValue)
                {
                    var owner = context.Owners.FirstOrDefault(o => o.Id == fundCall.OwnerId.Value);
                    if (owner != null)
                        return $"{owner.FirstName} {owner.LastName}".Trim();
                }
                return fundCall.OwnerNameSnapshot;
            }
        }
    }

    /// <summary>
    /// Pure, stateless helpers used by the FundCall GraphQL resolvers.
    /// No [Service] injection — the logic operates only on the in-memory
    /// FundCall entity. Mirrors FundCallService.EvaluateDeleteBlocker
    /// (FRS-FCF-LCM-2026-001 §2.1) without a DB round-trip.
    /// </summary>
    internal static class FundCallLifecycleHelpers
    {
        public const int DraftDeletionGraceDays = 30;

        public static bool IsDeletable(FundCall fundCall)
            => GetDeleteBlockerReason(fundCall) == null;

        public static bool IsCancellable(FundCall fundCall)
            => fundCall?.Status != FundCallStatus.Cancelled;

        public static string? GetDeleteBlockerReason(FundCall fundCall)
        {
            if (fundCall == null) return null;
            if (fundCall.Status == FundCallStatus.Cancelled)
                return "Impossible de supprimer un appel de fonds annulé. Il est conservé pour la traçabilité.";
            if (fundCall.Status != FundCallStatus.ToPay)
                return "Impossible de supprimer un appel de fonds publié ou traité. Utilisez l'annulation à la place.";
            if (fundCall.Payments != null && fundCall.Payments.Count > 0)
                return "Impossible de supprimer un appel de fonds ayant des versements. Utilisez l'annulation à la place.";
            if (fundCall.Invoices != null && fundCall.Invoices.Count > 0)
                return "Impossible de supprimer un appel de fonds ayant des factures associées. Utilisez l'annulation à la place.";
            if (fundCall.CreatedAt.HasValue
                && fundCall.CreatedAt.Value < DateTime.UtcNow.AddDays(-DraftDeletionGraceDays))
            {
                return $"Impossible de supprimer un appel de fonds créé il y a plus de {DraftDeletionGraceDays} jours. Utilisez l'annulation à la place.";
            }
            return null;
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
            descriptor.Field(p => p.ValidationStatus).Type<NonNullType<StringType>>();
            descriptor.Field(p => p.RejectionReason).Type<StringType>();
            descriptor.Field(p => p.CreatedAt).Type<NonNullType<DateTimeType>>();
        }
    }
}
