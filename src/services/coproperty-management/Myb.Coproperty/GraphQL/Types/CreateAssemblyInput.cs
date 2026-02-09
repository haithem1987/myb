using Myb.Coproperty.Models;
using AssemblyTypeModel = Myb.Coproperty.Models.AssemblyType;
using AssemblyStatusModel = Myb.Coproperty.Models.AssemblyStatus;

namespace Myb.Coproperty.GraphQL.Types;

public class CreateAssemblyInput
{
    public Guid CopropertyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime MeetingDate { get; set; }
    public string? Location { get; set; }
    public string? Agenda { get; set; }
    public string? Minutes { get; set; }
    public AssemblyTypeModel AssemblyType { get; set; } = AssemblyTypeModel.Ordinary;
    public AssemblyStatusModel Status { get; set; } = AssemblyStatusModel.Scheduled;
    public bool IsActive { get; set; } = true;

    public Assembly ToEntity()
    {
        return new Assembly
        {
            Id = Guid.NewGuid(),
            CopropertyId = CopropertyId,
            Title = Title,
            MeetingDate = MeetingDate,
            Location = Location,
            Agenda = Agenda,
            Minutes = Minutes,
            AssemblyType = AssemblyType,
            Status = Status,
            IsActive = IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }
}

public class UpdateAssemblyInput
{
    public string? Title { get; set; }
    public DateTime? MeetingDate { get; set; }
    public string? Location { get; set; }
    public string? Agenda { get; set; }
    public string? Minutes { get; set; }
    public AssemblyTypeModel? AssemblyType { get; set; }
    public AssemblyStatusModel? Status { get; set; }
}
