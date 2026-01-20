namespace Myb.Coproperty.Models.Dtos;

/// <summary>
/// Data point for treasury evolution chart
/// </summary>
public class TreasuryDataPoint
{
    public string Month { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public decimal Amount { get; set; }
}
