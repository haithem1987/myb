namespace Myb.Notification.Models;

public class CommunicationLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? SenderId { get; set; }
    public string SenderType { get; set; } = "system";
    public string RecipientId { get; set; } = "";
    public string? RecipientEmail { get; set; }
    public string? CopropertyId { get; set; }
    public CommunicationChannel Channel { get; set; }
    public string Subject { get; set; } = "";
    public string? Body { get; set; }
    public string? TemplateId { get; set; }
    public DeliveryStatus Status { get; set; } = DeliveryStatus.Sent;
    public string? FailureReason { get; set; }
    public string? EventType { get; set; }
    public Guid? RelatedEntityId { get; set; }
    public string? RelatedEntityType { get; set; }
    public Guid? CampaignId { get; set; }
    public DateTimeOffset SentAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DeliveredAt { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
}

public enum CommunicationChannel { InApp, Push, Email }
public enum DeliveryStatus { Pending, Sent, Delivered, Failed, Read }
