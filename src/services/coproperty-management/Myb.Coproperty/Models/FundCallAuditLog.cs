using Myb.Common.Models;

namespace Myb.Coproperty.Models;

/// <summary>
/// Audit-log entry for every significant lifecycle action on a Call for Funds
/// (Appel de Fonds). Required by FRS-FCF-LCM-2026-001 to maintain financial
/// audit integrity: any cancellation or deletion of a published fund call
/// MUST be recorded here for the legal retention period.
/// </summary>
public class FundCallAuditLog : IEntity<Guid>
{
    public Guid Id { get; set; }

    /// <summary>Fund call this entry refers to. Nullable so the FK is preserved
    /// even if the parent fund call is hard-deleted (only allowed for drafts
    /// with no children, but the audit row is written BEFORE the delete).</summary>
    public Guid FundCallId { get; set; }

    /// <summary>What happened.</summary>
    public FundCallAuditAction Action { get; set; }

    /// <summary>Status of the fund call before the action.</summary>
    public FundCallStatus? PreviousStatus { get; set; }

    /// <summary>Status of the fund call after the action.</summary>
    public FundCallStatus? NewStatus { get; set; }

    /// <summary>Free-text reason (mandatory for Cancellation, optional otherwise).</summary>
    public string? Reason { get; set; }

    /// <summary>Keycloak user id of the actor that performed the action.</summary>
    public Guid ActorUserId { get; set; }

    /// <summary>Role of the actor at the time of the action (e.g. "Syndic", "Owner").</summary>
    public string? ActorRole { get; set; }

    /// <summary>Display name of the actor (denormalised for resilience if the user is later removed).</summary>
    public string? ActorDisplayName { get; set; }

    /// <summary>Optional JSON snapshot of the fund call for forensic reconstruction.</summary>
    public string? MetadataJson { get; set; }

    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Discriminator for the kinds of actions that can be recorded on a fund call.
/// </summary>
public enum FundCallAuditAction
{
    Created = 0,
    Updated = 1,
    Published = 2,
    PaymentAdded = 3,
    PaymentApproved = 4,
    PaymentRejected = 5,
    Cancelled = 6,
    Deleted = 7
}
