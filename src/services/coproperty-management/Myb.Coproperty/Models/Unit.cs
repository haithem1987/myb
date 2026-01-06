namespace Myb.Coproperty.Models;

/// <summary>
/// Represents a unit (lot) within a coproperty
/// </summary>
public class Unit
{
    public Guid Id { get; set; }
    public Guid CopropertyId { get; set; }
    public string UnitNumber { get; set; } = string.Empty;
    public int? Floor { get; set; }
    public decimal? Area { get; set; }
    public int Shares { get; set; }
    public string? UnitType { get; set; }
    public string? Description { get; set; }
    public bool IsOccupied { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation Properties
    public Coproperty Coproperty { get; set; } = null!;
    public ICollection<Owner> Owners { get; set; } = new List<Owner>();
    public ICollection<ChargeDistribution> ChargeDistributions { get; set; } = new List<ChargeDistribution>();
    public ICollection<CopropertyInvoice> Invoices { get; set; } = new List<CopropertyInvoice>();
}
