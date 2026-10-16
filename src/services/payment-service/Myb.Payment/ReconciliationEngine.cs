using Myb.Payment.Models;

namespace Myb.Payment;

public interface IReconciliationEngine
{
    IReadOnlyList<ReconciliationResult> Reconcile(
        IReadOnlyList<BankTransaction> bankTransactions,
        IReadOnlyList<StripePayment> expectedPayments,
        Guid statementId);
}

public class ReconciliationEngine : IReconciliationEngine
{
    private const int ExactMatchDaysTolerance = 3;

    public IReadOnlyList<ReconciliationResult> Reconcile(
        IReadOnlyList<BankTransaction> bankTransactions,
        IReadOnlyList<StripePayment> expectedPayments,
        Guid statementId)
    {
        var results = new List<ReconciliationResult>();
        var usedPaymentIds = new HashSet<int>();

        foreach (var tx in bankTransactions)
        {
            var candidates = expectedPayments
                .Where(p => !usedPaymentIds.Contains(p.Id) && p.Price == tx.Amount)
                .ToList();

            var exactMatch = candidates.FirstOrDefault(p =>
                Math.Abs((p.PaymentDate.Date - tx.Date.Date).Days) <= ExactMatchDaysTolerance);

            if (exactMatch != null)
            {
                usedPaymentIds.Add(exactMatch.Id);
                results.Add(new ReconciliationResult
                {
                    BankStatementId = statementId,
                    BankTransactionId = tx.Id,
                    MatchedPaymentId = exactMatch.Id,
                    Status = ReconciliationStatus.AutoMatched,
                    Note = $"Auto-matched: amount {tx.Amount:F2}, date diff {Math.Abs((exactMatch.PaymentDate.Date - tx.Date.Date).Days)} day(s)"
                });
                continue;
            }

            var looseMatch = candidates.FirstOrDefault();
            if (looseMatch != null)
            {
                results.Add(new ReconciliationResult
                {
                    BankStatementId = statementId,
                    BankTransactionId = tx.Id,
                    MatchedPaymentId = looseMatch.Id,
                    Status = ReconciliationStatus.ManualSuggestion,
                    Note = $"Amount matches but date differs by {Math.Abs((looseMatch.PaymentDate.Date - tx.Date.Date).Days)} day(s)"
                });
                continue;
            }

            results.Add(new ReconciliationResult
            {
                BankStatementId = statementId,
                BankTransactionId = tx.Id,
                MatchedPaymentId = null,
                Status = ReconciliationStatus.Unmatched,
                Note = $"No matching payment found for amount {tx.Amount:F2} on {tx.Date:yyyy-MM-dd}"
            });
        }

        return results;
    }
}
