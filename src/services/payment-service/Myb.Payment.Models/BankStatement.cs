namespace Myb.Payment.Models;

public class BankStatement
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FileName { get; set; } = "";
    public string Format { get; set; } = "";  // "OFX" or "CSV"
    public DateTime ImportedAt { get; set; } = DateTime.UtcNow;
    public string ImportedByUserId { get; set; } = "";
    public string? CopropertyId { get; set; }
    public List<BankTransaction> Transactions { get; set; } = [];
    public List<ReconciliationResult> Results { get; set; } = [];
}
