namespace Myb.Coproperty.Models.Dtos;

/// <summary>
/// Creates every charge distribution and its related calls for funds as one unit of work.
/// </summary>
public class CreateDistributionInput
{
    public Guid CopropertyId { get; set; }
    public IReadOnlyList<Guid> ChargeIds { get; set; } = Array.Empty<Guid>();
    public IReadOnlyList<CreateFundCallInput> FundCalls { get; set; } = Array.Empty<CreateFundCallInput>();
}
