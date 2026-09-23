namespace Myb.Coproperty.Models;

/// <summary>
/// Persists the Syndic who must be notified when a user first activates their account.
/// This cannot live only in Keycloak because custom user attributes may be filtered out.
/// </summary>
public class AccountActivationNotification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid RecipientUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SentAt { get; set; }
}
