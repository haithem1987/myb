using Myb.Common.Models;

namespace Myb.Coproperty.Models;

/// <summary>
/// Represents an invoice for coproperty charges
/// </summary>
public class CopropertyInvoice : IEntity<Guid>
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public Guid ChargeId { get; set; }
    public Guid UnitId { get; set; }
    public Guid OwnerId { get; set; }
    public decimal Amount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime InvoiceDate { get; set; }
    public DateTime DueDate { get; set; }
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Pending;
    public DateTime? PaidDate { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Notes { get; set; }
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation Properties
    public Charge Charge { get; set; } = null!;
    public Unit Unit { get; set; } = null!;
    public Owner Owner { get; set; } = null!;
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
