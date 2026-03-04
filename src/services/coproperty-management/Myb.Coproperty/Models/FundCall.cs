using Myb.Common.Models;

namespace Myb.Coproperty.Models;

/// <summary>
/// Represents a fund call (appel de fonds) for a coproperty.
/// A fund call is used to request payments from owners for specific charges.
/// </summary>
public class FundCall : IEntity<Guid>
{
    public Guid Id { get; set; }
    public Guid CopropertyId { get; set; }

    /// <summary>Optional: owner this fund call is targeted at (null = all owners)</summary>
    public Guid? OwnerId { get; set; }

    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }
    public string Description { get; set; } = string.Empty;

    /// <summary>Payment status: ToPay | Paid | Validated (stored as English string)</summary>
    public FundCallStatus Status { get; set; } = FundCallStatus.ToPay;

    public bool IsActive { get; set; } = true;
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public Coproperty Coproperty { get; set; } = null!;
    public Owner? Owner { get; set; }
    public ICollection<CopropertyInvoice> Invoices { get; set; } = new List<CopropertyInvoice>();
    public ICollection<FundCallPayment> Payments { get; set; } = new List<FundCallPayment>();
}
