using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Myb.Coproperty.Models;
using Myb.Coproperty.Models.Dtos;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.Controllers;

/// <summary>
/// Internal-only endpoints called by other microservices (payment-service).
/// Protected by service-to-service JWT — not exposed to public API.
/// </summary>
[ApiController]
[Route("internal/fund-calls")]
[Authorize]
public class InternalFundCallController : ControllerBase
{
    private readonly IFundCallService _fundCallService;

    public InternalFundCallController(IFundCallService fundCallService)
    {
        _fundCallService = fundCallService;
    }

    /// <summary>
    /// Creates a FundCallPayment from a reconciled bank transaction and immediately approves it.
    /// Called by payment-service after auto or manual bank reconciliation.
    /// </summary>
    [HttpPost("{fundCallId:guid}/payments/from-bank")]
    public async Task<IActionResult> CreateFromBankReconciliation(
        Guid fundCallId,
        [FromBody] BankReconciliationPaymentRequest request)
    {
        var userId = User.FindFirst("sub")?.Value
                  ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? "system";

        var input = new AddFundCallPaymentInput
        {
            Amount = request.Amount,
            PaymentDate = request.PaymentDate,
            PaymentMethod = "Virement",
            Justificatif = $"Rapproché via relevé bancaire — Réf: {request.BankTransactionRef}",
            JustificatifFileName = request.StatementFileName,
            JustificatifContentType = "application/pdf"
        };

        FundCallPayment payment;
        try
        {
            payment = await _fundCallService.AddPaymentAsync(fundCallId, input, userId);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }

        // Auto-approve: bank statement is definitive proof of payment
        try
        {
            var approved = await _fundCallService.ReviewPaymentAsync(payment.Id, approved: true, null, userId);
            return Ok(new
            {
                PaymentId = approved.Id,
                FundCallId = fundCallId,
                ValidationStatus = approved.ValidationStatus,
                Amount = approved.Amount,
                PaymentDate = approved.PaymentDate
            });
        }
        catch (Exception ex)
        {
            // Payment created but approval failed — return partial success with warning
            return Ok(new
            {
                PaymentId = payment.Id,
                FundCallId = fundCallId,
                ValidationStatus = "Pending",
                Warning = $"Created but auto-approval failed: {ex.Message}"
            });
        }
    }

    /// <summary>
    /// Returns active FundCalls (ToPay/PendingValidation) for a coproperty.
    /// Used by payment-service UI to let the syndic pick the matching FundCall during manual reconciliation.
    /// </summary>
    [HttpGet("active")]
    public async Task<IActionResult> GetActive([FromQuery] Guid copropertyId)
    {
        var all = await _fundCallService.GetByCopropertyIdAsync(copropertyId);
        var active = all
            .Where(fc => fc.Status == FundCallStatus.ToPay || fc.Status == FundCallStatus.PendingValidation)
            .OrderBy(fc => fc.DueDate)
            .Select(fc => new
            {
                fc.Id,
                fc.Description,
                fc.Amount,
                fc.DueDate,
                Status = fc.Status.ToString(),
                OwnerName = fc.OwnerNameSnapshot,
                fc.CopropertyNameSnapshot
            });

        return Ok(active);
    }
}

public class BankReconciliationPaymentRequest
{
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string BankTransactionRef { get; set; } = string.Empty;
    public string? StatementFileName { get; set; }
    public string? BankLabel { get; set; }
}
