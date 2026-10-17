using Myb.Payment;
using Myb.Payment.Models;
using Xunit;

namespace Myb.Payment.Tests;

/// <summary>
/// Tests for the bank reconciliation → FundCallPayment integration fields.
/// Covers ReconciliationResult model extensions and ValidateReconciliationRequest.
/// </summary>
public class FundCallIntegrationTests
{
    // ── ReconciliationResult model ──────────────────────────────────────────

    [Fact]
    public void ReconciliationResult_HasFundCallId_DefaultNull()
    {
        var result = new ReconciliationResult();
        Assert.Null(result.FundCallId);
        Assert.Null(result.FundCallPaymentId);
    }

    [Fact]
    public void ReconciliationResult_CanSetFundCallId()
    {
        var fundCallId = Guid.NewGuid().ToString();
        var paymentId  = Guid.NewGuid().ToString();
        var result = new ReconciliationResult
        {
            FundCallId        = fundCallId,
            FundCallPaymentId = paymentId
        };

        Assert.Equal(fundCallId, result.FundCallId);
        Assert.Equal(paymentId,  result.FundCallPaymentId);
    }

    // ── ValidateReconciliationRequest ───────────────────────────────────────

    [Fact]
    public void ValidateRequest_FundCallId_IsOptional()
    {
        var request = new ValidateReconciliationRequest { MatchedPaymentId = 5 };
        Assert.Null(request.FundCallId);
        Assert.Equal(5, request.MatchedPaymentId);
    }

    [Fact]
    public void ValidateRequest_CanCarryFundCallId()
    {
        var id = Guid.NewGuid().ToString();
        var request = new ValidateReconciliationRequest { FundCallId = id };
        Assert.Equal(id, request.FundCallId);
    }

    // ── FundCallSummary (client DTO) ────────────────────────────────────────

    [Fact]
    public void FundCallSummary_CanBeCreated()
    {
        var summary = new FundCallSummary
        {
            Id          = Guid.NewGuid().ToString(),
            Description = "Charges Oct 2024",
            Amount      = 320m,
            DueDate     = new DateTime(2024, 10, 31, 0, 0, 0, DateTimeKind.Utc),
            Status      = "ToPay",
            OwnerName   = "Ben Ali Ahmed"
        };

        Assert.Equal(320m, summary.Amount);
        Assert.Equal("ToPay", summary.Status);
    }

    // ── FundCallPaymentCreatedResult ────────────────────────────────────────

    [Fact]
    public void FundCallPaymentCreatedResult_DefaultsAreEmpty()
    {
        var result = new FundCallPaymentCreatedResult();
        Assert.Equal(string.Empty, result.PaymentId);
        Assert.Equal(string.Empty, result.FundCallId);
        Assert.Null(result.Warning);
    }

    [Fact]
    public void FundCallPaymentCreatedResult_WithWarning_IsPartialSuccess()
    {
        var result = new FundCallPaymentCreatedResult
        {
            PaymentId        = Guid.NewGuid().ToString(),
            FundCallId       = Guid.NewGuid().ToString(),
            ValidationStatus = "Pending",
            Warning          = "Auto-approval failed: service unavailable"
        };

        Assert.NotNull(result.Warning);
        Assert.Equal("Pending", result.ValidationStatus);
    }

    // ── ReconciliationEngine — FundCallId not set by engine (engine unchanged) ──

    [Fact]
    public void ReconciliationEngine_DoesNotSetFundCallId()
    {
        var engine      = new ReconciliationEngine();
        var statementId = Guid.NewGuid();
        var date        = new DateTime(2024, 10, 2, 0, 0, 0, DateTimeKind.Utc);
        var tx          = new BankTransaction { Id = Guid.NewGuid(), BankStatementId = statementId, Amount = 320m, Date = date, Label = "VIR APT001" };
        var payment     = new StripePayment  { Id = 1, UserId = "u", ServiceId = 1, ServiceName = "Charge", Price = 320m, PaymentDate = date, PaymentStatus = "Paid", PaymentMethod = "Card", IsRecurring = false };

        var results = engine.Reconcile([tx], [payment], statementId);

        Assert.Single(results);
        Assert.Equal(ReconciliationStatus.AutoMatched, results[0].Status);
        // FundCallId is NOT set by the engine — that is the controller's job after user selects a FundCall
        Assert.Null(results[0].FundCallId);
        Assert.Null(results[0].FundCallPaymentId);
    }
}
