namespace Myb.Payment.Models;

public enum ReconciliationStatus
{
    AutoMatched,
    ManualSuggestion,
    Unmatched
}

public class ReconciliationResult
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BankStatementId { get; set; }
    public Guid BankTransactionId { get; set; }
    public int? MatchedPaymentId { get; set; }
    public ReconciliationStatus Status { get; set; }
    public string? Note { get; set; }
    public bool IsManuallyValidated { get; set; }
    /// <summary>ID of the FundCall in coproperty-service that this transaction was reconciled against.</summary>
    public string? FundCallId { get; set; }
    /// <summary>ID of the FundCallPayment created in coproperty-service after reconciliation.</summary>
    public string? FundCallPaymentId { get; set; }
    public BankStatement? BankStatement { get; set; }
    public BankTransaction? BankTransaction { get; set; }
}
