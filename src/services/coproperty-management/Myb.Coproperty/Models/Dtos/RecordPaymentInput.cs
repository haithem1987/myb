namespace Myb.Coproperty.Models.Dtos;

/// <summary>
/// DTO for recording payments
/// </summary>
public class RecordPaymentInput
{
    public Guid InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? Reference { get; set; }
    public string? Notes { get; set; }
}
