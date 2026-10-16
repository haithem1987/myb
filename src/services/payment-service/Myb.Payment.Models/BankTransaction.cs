namespace Myb.Payment.Models;

public class BankTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BankStatementId { get; set; }
    public DateTime Date { get; set; }
    public decimal Amount { get; set; }
    public string Label { get; set; } = "";
    public string? Reference { get; set; }
    public BankStatement? BankStatement { get; set; }
}
