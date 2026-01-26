using HotChocolate;

namespace Myb.Coproperty.GraphQL.Types
{
    /// <summary>
    /// Input DTO for updating a MaintenanceRequest with date strings instead of DateTime objects.
    /// This allows us to bypass HotChocolate's DateTime scalar parsing issues.
    /// </summary>
    public class UpdateMaintenanceRequestInput
    {
        public required Guid Id { get; set; }
        public required Guid CopropertyId { get; set; }
        public Guid? UnitId { get; set; }
        public required Guid RequestedBy { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public required string Category { get; set; }
        public required string Priority { get; set; }
        public required string Status { get; set; }
        public Guid? AssignedTo { get; set; }
        public decimal? EstimatedCost { get; set; }
        public decimal? ActualCost { get; set; }
        public string? ScheduledDate { get; set; }  // String instead of DateTime
        public string? CompletedDate { get; set; }  // String instead of DateTime

        /// <summary>
        /// Convert this input to a MaintenanceRequest entity, parsing the date strings.
        /// </summary>
        public Myb.Coproperty.Models.MaintenanceRequest ToMaintenanceRequest()
        {
            return new Myb.Coproperty.Models.MaintenanceRequest
            {
                Id = Id,
                CopropertyId = CopropertyId,
                UnitId = UnitId,
                RequestedBy = RequestedBy,
                Title = Title,
                Description = Description,
                Category = Enum.Parse<Myb.Coproperty.Models.MaintenanceCategory>(Category, ignoreCase: true),
                Priority = Enum.Parse<Myb.Coproperty.Models.Priority>(Priority, ignoreCase: true),
                Status = Enum.Parse<Myb.Coproperty.Models.MaintenanceStatus>(Status, ignoreCase: true),
                AssignedTo = AssignedTo,
                EstimatedCost = EstimatedCost,
                ActualCost = ActualCost,
                ScheduledDate = !string.IsNullOrEmpty(ScheduledDate) && DateTime.TryParse(ScheduledDate, out var scheduledDate)
                    ? DateTime.SpecifyKind(scheduledDate, DateTimeKind.Utc)
                    : null,
                CompletedDate = !string.IsNullOrEmpty(CompletedDate) && DateTime.TryParse(CompletedDate, out var completedDate)
                    ? DateTime.SpecifyKind(completedDate, DateTimeKind.Utc)
                    : null,
                UpdatedAt = DateTime.UtcNow
            };
        }
    }
}
