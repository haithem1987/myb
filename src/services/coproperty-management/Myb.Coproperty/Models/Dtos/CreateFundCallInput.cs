namespace Myb.Coproperty.Models.Dtos;

/// <summary>
/// Input DTO for creating a fund call
/// </summary>
public class CreateFundCallInput
{
    public Guid? CopropertyId { get; set; }
    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }
    public string Description { get; set; } = string.Empty;
}
