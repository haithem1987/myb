using Myb.Common.Models;

namespace Myb.Coproperty.Models;

/// <summary>
/// Represents the association between an owner and their units (lots)
/// Allows an owner to own multiple units with different ownership percentages
/// </summary>
public class OwnerUnit : IEntity<Guid>
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public Guid UnitId { get; set; }
    public decimal OwnershipPercentage { get; set; } = 100.00m;
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime? EndDate { get; set; }
    public bool IsMainOwner { get; set; } = true;
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation Properties
    public Owner Owner { get; set; } = null!;
    public Unit Unit { get; set; } = null!;
}
