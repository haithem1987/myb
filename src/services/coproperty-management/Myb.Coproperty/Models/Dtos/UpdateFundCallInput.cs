namespace Myb.Coproperty.Models.Dtos;

/// <summary>
/// Input DTO for updating a fund call's status
/// </summary>
public class UpdateFundCallInput
{
    /// <summary>New status for the fund call</summary>
    public FundCallStatus Status { get; set; }
}
