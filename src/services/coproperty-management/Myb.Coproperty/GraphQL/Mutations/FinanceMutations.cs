using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Models.Dtos;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Mutations;

/// <summary>
/// GraphQL mutations for financial operations
/// </summary>
[ExtendObjectType("Mutation")]
public class FinanceMutations
{
    /// <summary>
    /// Generate invoices from a charge
    /// </summary>
    public async Task<List<CopropertyInvoice>> GenerateInvoicesFromCharge(
        Guid chargeId,
        [Service] IFinanceService financeService,
        [Service] IAuthenticationService authService) =>
        await financeService.GenerateInvoicesFromChargeAsync(chargeId, authService.GetCurrentUserId());

    /// <summary>
    /// Record a payment for an invoice
    /// </summary>
    public async Task<Payment> RecordPayment(
        RecordPaymentInput input,
        [Service] IFinanceService financeService,
        [Service] IAuthenticationService authService) =>
        await financeService.RecordPaymentAsync(input, authService.GetCurrentUserId());

    /// <summary>
    /// Send payment reminder for an invoice
    /// </summary>
    public async Task<bool> SendPaymentReminder(
        Guid invoiceId,
        [Service] IFinanceService financeService,
        int level = 1)
    {
        await financeService.SendPaymentReminderAsync(invoiceId, level);
        return true;
    }
}

/// <summary>
/// Authentication service interface for getting current user context
/// </summary>
public interface IAuthenticationService
{
    string GetCurrentUserId();
}
