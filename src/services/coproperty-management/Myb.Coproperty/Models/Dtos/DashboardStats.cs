namespace Myb.Coproperty.Models.Dtos;

/// <summary>
/// Dashboard statistics for coproperty overview
/// </summary>
public class DashboardStats
{
    public int TotalCoproperties { get; set; }
    public int TotalUnits { get; set; }
    public int OccupiedUnits { get; set; }
    public decimal TotalBalance { get; set; }
    public decimal TotalCharges { get; set; }
    public int PendingMaintenance { get; set; }
    public int OverdueInvoices { get; set; }
    public int TotalOwners { get; set; }
    public int ActiveCharges { get; set; }
    public decimal TotalArea { get; set; }
    public decimal OccupancyRate { get; set; }
}
