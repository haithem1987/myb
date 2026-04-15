namespace Myb.Coproperty.Models.Dtos;

/// <summary>
/// Real treasury: actual cash in/out (bank movements)
/// </summary>
public class RealTreasury
{
    /// <summary>Opening balance at start of period</summary>
    public decimal OpeningBalance { get; set; }
    /// <summary>Total cash received (payments from owners)</summary>
    public decimal TotalEncaissements { get; set; }
    /// <summary>Total cash paid out (supplier payments, expenses)</summary>
    public decimal TotalDecaissements { get; set; }
    /// <summary>Current available balance = Opening + Encaissements - Decaissements</summary>
    public decimal CurrentBalance { get; set; }
}

/// <summary>
/// Accounting treasury: financial obligations (what is owed/due)
/// </summary>
public class AccountingTreasury
{
    /// <summary>Total charges created (obligations)</summary>
    public decimal TotalChargesEngaged { get; set; }
    /// <summary>Total amount invoiced to owners</summary>
    public decimal TotalInvoiced { get; set; }
    /// <summary>Total collected from owners</summary>
    public decimal TotalCollected { get; set; }
    /// <summary>Total still owed by owners</summary>
    public decimal TotalOutstanding { get; set; }
    /// <summary>Total overdue amount</summary>
    public decimal TotalOverdue { get; set; }
    /// <summary>Balance = Collected - Charges</summary>
    public decimal AccountingBalance { get; set; }
}

/// <summary>
/// Combined treasury dashboard with both real and accounting views
/// </summary>
public class TreasuryDashboard
{
    public Guid CopropertyId { get; set; }
    public string CopropertyName { get; set; } = string.Empty;
    public RealTreasury RealTreasury { get; set; } = new();
    public AccountingTreasury AccountingTreasury { get; set; } = new();
    /// <summary>Difference between real and accounting = working capital need</summary>
    public decimal WorkingCapitalGap { get; set; }
    /// <summary>Collection rate (%) = Collected / Invoiced × 100</summary>
    public decimal CollectionRate { get; set; }
    /// <summary>Monthly treasury evolution</summary>
    public List<TreasuryDataPoint> Evolution { get; set; } = new();
    /// <summary>Expense breakdown by charge type</summary>
    public List<ExpenseBreakdown> ExpensesByType { get; set; } = new();
}

/// <summary>
/// Expense breakdown by category
/// </summary>
public class ExpenseBreakdown
{
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal Percentage { get; set; }
}

/// <summary>
/// Owner payment status for tracking unpaid/late payments
/// </summary>
public class OwnerPaymentSummary
{
    public Guid OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public List<string> UnitNumbers { get; set; } = new();
    public decimal TotalDue { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal TotalOutstanding { get; set; }
    public decimal TotalOverdue { get; set; }
    public int OverdueInvoiceCount { get; set; }
    public int PendingInvoiceCount { get; set; }
    public DateTime? OldestOverdueDate { get; set; }
    public int DaysOverdue { get; set; }
    public PaymentHealthStatus HealthStatus { get; set; }
    public List<OwnerInvoiceDetail> Invoices { get; set; } = new();
}

/// <summary>
/// Detailed invoice info for owner payment tracking 
/// </summary>
public class OwnerInvoiceDetail
{
    public Guid InvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string UnitNumber { get; set; } = string.Empty;
    public string ChargeName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public DateTime DueDate { get; set; }
    public int DaysLate { get; set; }
    public InvoiceStatus Status { get; set; }
    public int ReminderLevel { get; set; }
}

/// <summary>
/// Payment health classification for owners
/// </summary>
public enum PaymentHealthStatus
{
    /// <summary>All invoices paid on time</summary>
    Good = 0,
    /// <summary>Has pending invoices but not yet overdue</summary>
    Pending = 1,
    /// <summary>Has invoices overdue by less than 30 days</summary>
    Late = 2,
    /// <summary>Has invoices overdue by 30-90 days</summary>
    Critical = 3,
    /// <summary>Has invoices overdue by more than 90 days</summary>
    Delinquent = 4
}

/// <summary>
/// Summary of all unpaid/late payments across a coproperty
/// </summary>
public class UnpaidPaymentsSummary
{
    public Guid CopropertyId { get; set; }
    public int TotalOwners { get; set; }
    public int OwnersWithOverdue { get; set; }
    public int TotalOverdueInvoices { get; set; }
    public decimal TotalOverdueAmount { get; set; }
    public decimal TotalPendingAmount { get; set; }
    /// <summary>Average days overdue across all overdue invoices</summary>
    public int AverageDaysOverdue { get; set; }
    /// <summary>Owner payment summaries sorted by severity</summary>
    public List<OwnerPaymentSummary> OwnerSummaries { get; set; } = new();
}
