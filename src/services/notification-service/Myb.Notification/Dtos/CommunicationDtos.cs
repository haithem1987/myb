using Myb.Notification.Models;

namespace Myb.Notification.Dtos;

public record CommunicationLogDto(
    Guid Id,
    string? SenderId,
    string SenderType,
    string RecipientId,
    string? RecipientEmail,
    string? CopropertyId,
    string Channel,
    string Subject,
    string? Body,
    string Status,
    string? FailureReason,
    string? EventType,
    Guid? CampaignId,
    DateTimeOffset SentAt,
    DateTimeOffset? DeliveredAt,
    DateTimeOffset? ReadAt)
{
    public static CommunicationLogDto From(CommunicationLog l) => new(
        l.Id, l.SenderId, l.SenderType, l.RecipientId, l.RecipientEmail,
        l.CopropertyId, l.Channel.ToString(), l.Subject, l.Body,
        l.Status.ToString(), l.FailureReason, l.EventType, l.CampaignId,
        l.SentAt, l.DeliveredAt, l.ReadAt);
}

public record CampaignDto(
    Guid Id,
    string Name,
    string? Description,
    string? CopropertyId,
    string CreatedBy,
    string Status,
    string[] Channels,
    int TotalRecipients,
    int SentCount,
    int FailedCount,
    DateTimeOffset? ScheduledAt,
    DateTimeOffset? StartedAt,
    DateTimeOffset? CompletedAt,
    DateTimeOffset CreatedAt);

public record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int Size);

public record CommunicationStatsDto(
    int Total,
    ChannelStats ByChannel,
    StatusStats ByStatus);

public record ChannelStats(int InApp, int Push, int Email);
public record StatusStats(int Sent, int Delivered, int Failed, int Read);

public record LogFilterDto(
    string? CopropertyId = null,
    string? Channel = null,
    string? Status = null,
    DateTimeOffset? From = null,
    DateTimeOffset? To = null,
    string? RecipientId = null,
    Guid? CampaignId = null,
    int Page = 0,
    int Size = 50);

public record CampaignFilterDto(
    string? CopropertyId = null,
    string? Status = null,
    int Page = 0,
    int Size = 20);

public record CreateCampaignRequest(
    string Name,
    string? Description,
    string? CopropertyId,
    string[] Channels,
    string Message,
    string? Subject,
    /// <summary>Resolved by the caller before creation. Required to start a campaign.</summary>
    string[] RecipientIds);
