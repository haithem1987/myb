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
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation Properties
    public Charge Charge { get; set; } = null!;
    public Unit Unit { get; set; } = null!;
}
