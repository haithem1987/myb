using Myb.Common.Models;

namespace Myb.Coproperty.Models;

/// <summary>
/// Represents a charge (expense) for a coproperty
/// </summary>
public class Charge : IEntity<Guid>
{
    public Guid Id { get; set; }
    public Guid CopropertyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ChargeType ChargeType { get; set; }
    public string Frequency { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public DistributionMethod DistributionMethod { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsContribution { get; set; } = false;
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation Properties
    public Coproperty Coproperty { get; set; } = null!;
    public ICollection<ChargeDistribution> Distributions { get; set; } = new List<ChargeDistribution>();
    public ICollection<CopropertyInvoice> Invoices { get; set; } = new List<CopropertyInvoice>();
}
