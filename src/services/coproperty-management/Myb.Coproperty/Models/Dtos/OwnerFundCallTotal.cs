namespace Myb.Coproperty.Models.Dtos;

/// <summary>
/// Represents the existing (unpaid) fund call total for an owner in a coproperty.
/// Used during repartition to avoid double-charging.
/// </summary>
public class OwnerFundCallTotal
{
    public Guid OwnerId { get; set; }
    public decimal RemainingAmount { get; set; }
}
