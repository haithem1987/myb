namespace Myb.Coproperty.Models;

/// <summary>
/// Represents a charge (expense) for a coproperty
/// </summary>
public class Charge
{
    public Guid Id { get; set; }
    public Guid CopropertyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ChargeType ChargeType { get; set; }
    public ChargeFrequency Frequency { get; set; }
    public decimal TotalAmount { get; set; }
    public DistributionMethod DistributionMethod { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid CreatedBy { get; set; }
    
    // Navigation Properties
    public Coproperty Coproperty { get; set; } = null!;
    public ICollection<ChargeDistribution> Distributions { get; set; } = new List<ChargeDistribution>();
    public ICollection<CopropertyInvoice> Invoices { get; set; } = new List<CopropertyInvoice>();
}
