using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Models.Dtos;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Mutations;

/// <summary>
/// GraphQL mutations for fund call operations
/// </summary>
[ExtendObjectType("Mutation")]
public class FundCallMutations
{
    /// <summary>Create a new fund call</summary>
    public async Task<FundCall> CreateFundCall(
        CreateFundCallInput input,
        [Service] IFundCallService fundCallService,
        [Service] IAuthenticationService authService)
    {
        var userId = authService.GetCurrentUserId();
        return await fundCallService.CreateAsync(input, userId);
    }

    /// <summary>Update an existing fund call (amount, dueDate, description, owner, status)</summary>
    public async Task<FundCall> UpdateFundCall(
        Guid id,
        CreateFundCallInput input,
        [Service] IFundCallService fundCallService,
        [Service] IAuthenticationService authService)
    {
        var userId = authService.GetCurrentUserId();
        return await fundCallService.UpdateAsync(id, input, userId);
    }

    /// <summary>Update only the status of a fund call</summary>
    public async Task<FundCall> UpdateFundCallStatus(
        Guid id,
        UpdateFundCallInput input,
        [Service] IFundCallService fundCallService,
        [Service] IAuthenticationService authService)
    {
        var userId = authService.GetCurrentUserId();
        return await fundCallService.UpdateStatusAsync(id, input, userId);
    }

    /// <summary>Add a payment entry to an existing fund call</summary>
    public async Task<FundCallPayment> AddFundCallPayment(
        Guid fundCallId,
        AddFundCallPaymentInput input,
        [Service] IFundCallService fundCallService,
        [Service] IAuthenticationService authService)
    {
        var userId = authService.GetCurrentUserId();
        return await fundCallService.AddPaymentAsync(fundCallId, input, userId);
    }

    /// <summary>Delete a fund call</summary>
    public async Task<bool> DeleteFundCall(
        Guid id,
        [Service] IFundCallService fundCallService)
    {
        await fundCallService.DeleteAsync(id);
        return true;
    }

    /// <summary>Generate invoices from a fund call</summary>
    public async Task<List<CopropertyInvoice>> GenerateInvoicesFromFundCall(
        Guid fundCallId,
        [Service] IFundCallService fundCallService,
        [Service] IAuthenticationService authService)
    {
        var userId = authService.GetCurrentUserId();
        return await fundCallService.GenerateInvoicesFromFundCallAsync(fundCallId, userId);
    }

    /// <summary>
    /// Syndic reviews an owner payment: approve (→ Paid) or reject (→ back to ToPay, owner notified).
    /// </summary>
    public async Task<FundCallPayment> ReviewFundCallPayment(
        Guid paymentId,
        bool approved,
        string? rejectionReason,
        [Service] IFundCallService fundCallService,
        [Service] IAuthenticationService authService)
    {
        var userId = authService.GetCurrentUserId();
        return await fundCallService.ReviewPaymentAsync(paymentId, approved, rejectionReason, userId);
    }
}
