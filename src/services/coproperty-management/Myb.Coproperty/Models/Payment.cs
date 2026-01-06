namespace Myb.Coproperty.Models;

/// <summary>
/// Represents a payment made for an invoice
/// </summary>
public class Payment
{
    public Guid Id { get; set; }
    public Guid InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid CreatedBy { get; set; }
    
    // Navigation Properties
    public CopropertyInvoice Invoice { get; set; } = null!;
}
