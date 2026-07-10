using Myb.Common.Models;

namespace Myb.Coproperty.Models;

/// <summary>
/// Represents an incident report submitted by a resident (owner, tenant, or syndic manager)
/// </summary>
public class Signalement : IEntity<Guid>
{
    public Guid Id { get; set; }
    public Guid CopropertyId { get; set; }

    /// <summary>
    /// Keycloak user ID of the person who submitted the report
    /// </summary>
    public Guid ReportedBy { get; set; }

    /// <summary>
    /// Full name of the reporter (denormalized for display without extra lookups)
    /// </summary>
    public string ReporterName { get; set; } = string.Empty;

    public SignalementType Type { get; set; }
    public SignalementZone Zone { get; set; }
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Optional URL of an attached photo (stored in object storage)
    /// </summary>
    public string? PhotoUrl { get; set; }

    public SignalementStatus Status { get; set; } = SignalementStatus.EnCours;

    /// <summary>
    /// Number of residents who have viewed / acknowledged this report
    /// </summary>
    public int ViewsCount { get; set; } = 0;

    /// <summary>
    /// Optional comment added by the syndic when resolving or acknowledging
    /// </summary>
    public string? SyndicComment { get; set; }

    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Coproperty Coproperty { get; set; } = null!;
}
