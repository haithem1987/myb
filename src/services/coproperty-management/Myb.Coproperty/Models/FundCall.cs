using Myb.Common.Models;

namespace Myb.Coproperty.Models;

/// <summary>
/// Represents a fund call (appel de fonds) for a coproperty
/// A fund call is used to request payments from owners for specific charges
/// </summary>
public class FundCall : IEntity<Guid>
{
    public Guid Id { get; set; }
    public Guid CopropertyId { get; set; }
    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation Properties
    public Coproperty Coproperty { get; set; } = null!;
    public ICollection<CopropertyInvoice> Invoices { get; set; } = new List<CopropertyInvoice>();
}
