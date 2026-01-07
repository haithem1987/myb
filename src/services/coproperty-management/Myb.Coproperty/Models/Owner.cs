using Myb.Common.Models;

namespace Myb.Coproperty.Models;

/// <summary>
/// Represents an owner of a unit in a coproperty
/// </summary>
public class Owner : IEntity<Guid>
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid UnitId { get; set; }
    public decimal OwnershipPercentage { get; set; } = 100.00m;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsMainOwner { get; set; } = true;
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation Properties
    public Unit Unit { get; set; } = null!;
    public ICollection<CopropertyInvoice> Invoices { get; set; } = new List<CopropertyInvoice>();
}
