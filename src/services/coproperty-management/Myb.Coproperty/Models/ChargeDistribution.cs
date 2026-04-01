using Myb.Common.Models;

namespace Myb.Coproperty.Models;

/// <summary>
/// Represents the distribution of a charge to a specific unit
/// </summary>
public class ChargeDistribution : IEntity<Guid>
{
    public Guid Id { get; set; }
    public Guid ChargeId { get; set; }
    public Guid UnitId { get; set; }
    public decimal Amount { get; set; }
    public decimal Percentage { get; set; }
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    // Payment tracking
    public ChargePaymentStatus PaymentStatus { get; set; } = ChargePaymentStatus.Unpaid;
    public decimal PaidAmount { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? PaymentTransactionId { get; set; }
    public string? PaymentMethod { get; set; }
    
    // Navigation Properties
    public Charge Charge { get; set; } = null!;
    public Unit Unit { get; set; } = null!;
}

public enum ChargePaymentStatus
{
    Unpaid,
    Pending,
    Paid,
    PartiallyPaid,
    Failed
}
