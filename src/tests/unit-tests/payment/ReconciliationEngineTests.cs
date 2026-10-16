using Myb.Payment;
using Myb.Payment.Models;
using Xunit;

namespace Myb.Payment.Tests;

public class ReconciliationEngineTests
{
    private readonly ReconciliationEngine _engine = new();
    private readonly Guid _statementId = Guid.NewGuid();

    private static BankTransaction Tx(decimal amount, DateTime date, string label = "VIR TEST") =>
        new() { Id = Guid.NewGuid(), BankStatementId = Guid.NewGuid(), Amount = amount, Date = date, Label = label };

    private static StripePayment Payment(int id, decimal price, DateTime date) =>
        new() { UserId = "u1", ServiceId = 1, ServiceName = "Charge", Price = price, PaymentDate = date, PaymentStatus = "Paid", PaymentMethod = "Card", IsRecurring = false };

    [Fact]
    public void ExactAmountAndDateWithinTolerance_AutoMatched()
    {
        var date = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);
        var tx = Tx(250m, date);
        var payment = Payment(1, 250m, date.AddDays(2)); // within 3 days
        payment.Id = 1;

        var results = _engine.Reconcile([tx], [payment], _statementId);

        Assert.Single(results);
        Assert.Equal(ReconciliationStatus.AutoMatched, results[0].Status);
        Assert.Equal(1, results[0].MatchedPaymentId);
    }

    [Fact]
    public void ExactAmountButDateFarAway_ManualSuggestion()
    {
        var tx = Tx(250m, new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc));
        var payment = Payment(1, 250m, new DateTime(2026, 9, 15, 0, 0, 0, DateTimeKind.Utc)); // 16 days away
        payment.Id = 1;

        var results = _engine.Reconcile([tx], [payment], _statementId);

        Assert.Single(results);
        Assert.Equal(ReconciliationStatus.ManualSuggestion, results[0].Status);
        Assert.Equal(1, results[0].MatchedPaymentId);
    }

    [Fact]
    public void NoMatchingPayment_Unmatched()
    {
        var tx = Tx(999m, new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc));
        var payment = Payment(1, 100m, new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc));
        payment.Id = 1;

        var results = _engine.Reconcile([tx], [payment], _statementId);

        Assert.Single(results);
        Assert.Equal(ReconciliationStatus.Unmatched, results[0].Status);
        Assert.Null(results[0].MatchedPaymentId);
    }

    [Fact]
    public void SamePaymentNotMatchedTwice()
    {
        var date = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);
        var tx1 = Tx(250m, date);
        var tx2 = Tx(250m, date);
        var payment = Payment(1, 250m, date);
        payment.Id = 1;

        var results = _engine.Reconcile([tx1, tx2], [payment], _statementId);

        Assert.Equal(2, results.Count);
        var matched = results.Where(r => r.Status == ReconciliationStatus.AutoMatched).ToList();
        var unmatched = results.Where(r => r.Status == ReconciliationStatus.Unmatched || r.Status == ReconciliationStatus.ManualSuggestion).ToList();
        Assert.Single(matched);
        Assert.Single(unmatched);
    }

    [Fact]
    public void EmptyInputs_ReturnsEmptyResults()
    {
        var results = _engine.Reconcile([], [], _statementId);
        Assert.Empty(results);
    }

    [Fact]
    public void AllResultsHaveCorrectStatementId()
    {
        var date = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);
        var tx = Tx(100m, date);

        var results = _engine.Reconcile([tx], [], _statementId);

        Assert.All(results, r => Assert.Equal(_statementId, r.BankStatementId));
    }
}
