using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Types;

public class CreateSignalementInput
{
    public string CopropertyId { get; set; } = string.Empty;
    public string ReportedBy { get; set; } = string.Empty;
    public string ReporterName { get; set; } = string.Empty;
    public SignalementType Type { get; set; } = SignalementType.Panne;
    public SignalementZone Zone { get; set; } = SignalementZone.Autres;
    public string Description { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }

    public Signalement ToSignalement()
    {
        return new Signalement
        {
            Id = Guid.NewGuid(),
            CopropertyId = Guid.Parse(CopropertyId),
            ReportedBy = Guid.TryParse(ReportedBy, out var uid) ? uid : Guid.Empty,
            ReporterName = ReporterName,
            Type = Type,
            Zone = Zone,
            Description = Description,
            PhotoUrl = PhotoUrl,
            Status = SignalementStatus.EnCours,
            ViewsCount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
    }
}
