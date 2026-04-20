using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Types;

public class CreateInterventionInput
{
    public string? Id { get; set; }
    public string CopropertyId { get; set; } = string.Empty;
    public string? UnitId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string InterventionType { get; set; } = "Other";
    public string Priority { get; set; } = "Normal";
    public string? Status { get; set; }
    public string? ProviderName { get; set; }
    public string? ProviderPhone { get; set; }
    public string? ProviderEmail { get; set; }
    public string? AssignedTo { get; set; }
    public string? RequestedBy { get; set; }
    public decimal? EstimatedCost { get; set; }
    public decimal? ActualCost { get; set; }
    public string? PlannedDate { get; set; }
    public string? StartedDate { get; set; }
    public string? CompletedDate { get; set; }
    public string? Notes { get; set; }
    public string? Resolution { get; set; }
    public string? MaintenanceRequestId { get; set; }

    public Intervention ToIntervention()
    {
        var intervention = new Intervention
        {
            Id = !string.IsNullOrEmpty(Id) && Guid.TryParse(Id, out var id) ? id : Guid.NewGuid(),
            CopropertyId = Guid.Parse(CopropertyId),
            Title = Title,
            Description = Description,
            ProviderName = ProviderName,
            ProviderPhone = ProviderPhone,
            ProviderEmail = ProviderEmail,
            EstimatedCost = EstimatedCost,
            ActualCost = ActualCost,
            Notes = Notes,
            Resolution = Resolution,
        };

        if (!string.IsNullOrEmpty(UnitId) && Guid.TryParse(UnitId, out var unitId))
            intervention.UnitId = unitId;

        if (!string.IsNullOrEmpty(AssignedTo) && Guid.TryParse(AssignedTo, out var assignedTo))
            intervention.AssignedTo = assignedTo;

        if (!string.IsNullOrEmpty(RequestedBy) && Guid.TryParse(RequestedBy, out var requestedBy))
            intervention.RequestedBy = requestedBy;

        if (!string.IsNullOrEmpty(MaintenanceRequestId) && Guid.TryParse(MaintenanceRequestId, out var mrId))
            intervention.MaintenanceRequestId = mrId;

        if (Enum.TryParse<Models.InterventionType>(InterventionType, true, out var iType))
            intervention.InterventionType = iType;

        if (Enum.TryParse<Priority>(Priority, true, out var priority))
            intervention.Priority = priority;

        if (Enum.TryParse<InterventionStatus>(Status ?? "Draft", true, out var status))
            intervention.Status = status;

        if (!string.IsNullOrEmpty(PlannedDate) && DateTime.TryParse(PlannedDate, out var plannedDate))
            intervention.PlannedDate = plannedDate.ToUniversalTime();

        if (!string.IsNullOrEmpty(StartedDate) && DateTime.TryParse(StartedDate, out var startedDate))
            intervention.StartedDate = startedDate.ToUniversalTime();

        if (!string.IsNullOrEmpty(CompletedDate) && DateTime.TryParse(CompletedDate, out var completedDate))
            intervention.CompletedDate = completedDate.ToUniversalTime();

        return intervention;
    }
}
