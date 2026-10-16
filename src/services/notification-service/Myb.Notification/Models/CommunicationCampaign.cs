namespace Myb.Notification.Models;

public class CommunicationCampaign
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string? CopropertyId { get; set; }
    public string CreatedBy { get; set; } = "";
    public CampaignStatus Status { get; set; } = CampaignStatus.Draft;
    public string ChannelsJson { get; set; } = "[]";
    /// <summary>JSON-serialized string[]. Resolved by the caller at creation time.</summary>
    public string RecipientIdsJson { get; set; } = "[]";
    public string Message { get; set; } = "";
    public string? Subject { get; set; }
    public DateTimeOffset? ScheduledAt { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public int TotalRecipients { get; set; }
    public int SentCount { get; set; }
    public int FailedCount { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public enum CampaignStatus { Draft, Scheduled, Running, Completed, Cancelled }
