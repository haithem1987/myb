namespace Myb.Coproperty.Models;

/// <summary>
/// Represents a maintenance request for a coproperty
/// </summary>
public class MaintenanceRequest
{
    public Guid Id { get; set; }
    public Guid CopropertyId { get; set; }
    public Guid? UnitId { get; set; }
    public Guid RequestedBy { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public MaintenanceCategory Category { get; set; }
    public Priority Priority { get; set; } = Priority.Normal;
    public MaintenanceStatus Status { get; set; } = MaintenanceStatus.Pending;
    public Guid? AssignedTo { get; set; }
    public decimal? EstimatedCost { get; set; }
    public decimal? ActualCost { get; set; }
    public DateTime? ScheduledDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation Properties
    public Coproperty Coproperty { get; set; } = null!;
    public Unit? Unit { get; set; }
}
