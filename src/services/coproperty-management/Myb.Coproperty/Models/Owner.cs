using Myb.Common.Models;

namespace Myb.Coproperty.Models;

/// <summary>
/// Represents an owner in a coproperty who can own multiple units (lots)
/// </summary>
public class Owner : IEntity<Guid>
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation Properties
    public ICollection<OwnerUnit> OwnerUnits { get; set; } = new List<OwnerUnit>();
    public ICollection<CopropertyInvoice> Invoices { get; set; } = new List<CopropertyInvoice>();
    
    // Backward compatibility - deprecated, will be removed in future
    [Obsolete("Use OwnerUnits collection instead")]
    public Guid UnitId { get; set; }
    [Obsolete("Use OwnerUnits collection instead")]
    public Unit Unit { get; set; } = null!;
}
