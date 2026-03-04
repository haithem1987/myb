namespace Myb.Coproperty.Models.Dtos;

/// <summary>
/// Input DTO for creating a fund call
/// </summary>
public class CreateFundCallInput
{
    public Guid? CopropertyId { get; set; }

    /// <summary>Optional owner this fund call targets (null = all owners)</summary>
    public Guid? OwnerId { get; set; }

    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }
    public string Description { get; set; } = string.Empty;

    /// <summary>Initial status; defaults to ToPay if not provided (optional)</summary>
    public FundCallStatus? Status { get; set; } = null;
}
