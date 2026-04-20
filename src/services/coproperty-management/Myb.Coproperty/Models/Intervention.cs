using Myb.Common.Models;

namespace Myb.Coproperty.Models;

/// <summary>
/// Represents an intervention (work order) for a coproperty
/// </summary>
public class Intervention : IEntity<Guid>
{
    public Guid Id { get; set; }
    public Guid CopropertyId { get; set; }
    public Guid? UnitId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public InterventionType InterventionType { get; set; }
    public Priority Priority { get; set; } = Priority.Normal;
    public InterventionStatus Status { get; set; } = InterventionStatus.Draft;
    public string? ProviderName { get; set; }
    public string? ProviderPhone { get; set; }
    public string? ProviderEmail { get; set; }
    public Guid? AssignedTo { get; set; }
    public Guid? RequestedBy { get; set; }
    public decimal? EstimatedCost { get; set; }
    public decimal? ActualCost { get; set; }
    public DateTime? PlannedDate { get; set; }
    public DateTime? StartedDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public string? Notes { get; set; }
    public string? Resolution { get; set; }
    public Guid? MaintenanceRequestId { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Navigation Properties
    public Coproperty Coproperty { get; set; } = null!;
    public Unit? Unit { get; set; }
    public MaintenanceRequest? MaintenanceRequest { get; set; }
}
