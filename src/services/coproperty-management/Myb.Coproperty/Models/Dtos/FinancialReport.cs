namespace Myb.Coproperty.Models.Dtos;

/// <summary>
/// Financial report for a coproperty
/// </summary>
public class FinancialReport
{
    public Guid CopropertyId { get; set; }
    public int Year { get; set; }
    public decimal TotalCharges { get; set; }
    public decimal TotalCollected { get; set; }
    public decimal TotalOverdue { get; set; }
    public decimal Balance { get; set; }
    public List<MonthlyBalance> MonthlyBalances { get; set; } = new();
}

/// <summary>
/// Monthly balance data for financial reports
/// </summary>
public class MonthlyBalance
{
    public int Month { get; set; }
    public string MonthName { get; set; } = string.Empty;
    public decimal Opening { get; set; }
    public decimal Receipts { get; set; }
    public decimal Expenses { get; set; }
    public decimal Closing { get; set; }
}
