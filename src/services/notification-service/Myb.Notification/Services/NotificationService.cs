using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Myb.Common.Messaging;
using Myb.Common.Messaging.Models;
using Myb.Notification.Hubs;
using Myb.Notification.Models;

namespace Myb.Notification.Services;

public class NotificationService : INotificationService
{
    private readonly IDbContextFactory<NotificationContext> _contextFactory;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly IEmailPublisher _emailPublisher;
    private readonly IPushQueue _pushQueue;
    private readonly ICommunicationLogService? _commLog;

    public const string DefaultPushUrl = "/coproperty/select";
    public const string PushTitle = "MYB";

    public NotificationService(
        IDbContextFactory<NotificationContext> contextFactory,
        IHubContext<NotificationHub> hubContext,
        IEmailPublisher emailPublisher,
        IPushQueue pushQueue,
        ICommunicationLogService? commLog = null)
    {
        _contextFactory = contextFactory;
        _hubContext = hubContext;
        _emailPublisher = emailPublisher;
        _pushQueue = pushQueue;
        _commLog = commLog;
    }

    /// <summary>Only same-origin absolute paths are allowed, so a notification can never send
    /// the user to another site.</summary>
    public static string NormalizePushUrl(string? url) =>
        !string.IsNullOrWhiteSpace(url) && url.StartsWith('/') && !url.StartsWith("//") && !url.Contains('\\')
            ? url
            : DefaultPushUrl;

    public async Task SendNotificationAsync(
        string senderId, string receiverId, string message, string? copropertyId = null,
        bool push = false, string? url = null, PushUrgency urgency = PushUrgency.Normal)
    {
        var notification = new Models.Notification
        {
            SenderId = senderId,
            ReceiverId = receiverId,
            CopropertyId = string.IsNullOrWhiteSpace(copropertyId) ? null : copropertyId,
            Message = message,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        try
        {
            using var context = _contextFactory.CreateDbContext();
            context.Set<Models.Notification>().Add(notification);
            await context.SaveChangesAsync();
            await _hubContext.Clients.User(receiverId)
                .SendAsync("ReceiveNotification", message, notification.CopropertyId);
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            throw new InvalidOperationException("Failed to send notification.");
        }

        if (push)
        {
            _pushQueue.Enqueue(new PushJob(
                receiverId, notification.Id, PushTitle, message, NormalizePushUrl(url),
                notification.CopropertyId, urgency));
        }

        _ = WriteLogAsync(new CommunicationLog
        {
            SenderId = senderId,
            SenderType = "system",
            RecipientId = receiverId,
            CopropertyId = string.IsNullOrWhiteSpace(copropertyId) ? null : copropertyId,
            Channel = push ? CommunicationChannel.Push : CommunicationChannel.InApp,
            Subject = message,
            Status = DeliveryStatus.Sent,
        });
    }

    private async Task WriteLogAsync(CommunicationLog entry)
    {
        if (_commLog is null) return;
        try { await _commLog.LogAsync(entry); }
        catch (Exception ex) { Console.Error.WriteLine($"[CommLog] {ex.Message}"); }
    }

    public async Task<List<Models.Notification>> GetNotificationsAsync(
        string userId, string? copropertyId = null)
    {
        using var context = _contextFactory.CreateDbContext();
        var query = context.Set<Models.Notification>()
            .Where(n => n.ReceiverId == userId);
        if (!string.IsNullOrWhiteSpace(copropertyId))
            query = query.Where(n => n.CopropertyId == copropertyId);
        return await query
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task SendEmailNotificationAsync(
        string receiverEmail, string subject, string htmlBody, string? language = null,
        string? copropertyId = null, string? recipientId = null)
    {
        await _emailPublisher.PublishAsync(new EmailMessage
        {
            To = receiverEmail,
            Subject = subject,
            Language = language?.StartsWith("en", StringComparison.OrdinalIgnoreCase) == true ? "en" : "fr",
            HtmlBody = htmlBody,
            Source = "notification-service"
        });

        _ = WriteLogAsync(new CommunicationLog
        {
            SenderType = "system",
            RecipientId = recipientId ?? receiverEmail,
            RecipientEmail = receiverEmail,
            CopropertyId = copropertyId,
            Channel = CommunicationChannel.Email,
            Subject = subject,
            Status = DeliveryStatus.Sent,
        });
    }

    public async Task<bool> MarkAsReadAsync(string notificationId, string? receiverId)
    {
        using var context = _contextFactory.CreateDbContext();
        var notification = await context.Set<Models.Notification>().FindAsync(notificationId);
        if (notification == null || (receiverId != null && notification.ReceiverId != receiverId))
            return false;
        notification.IsRead = true;
        notification.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
        return true;
    }

    public async Task MarkAllAsReadAsync(string userId, string? copropertyId = null)
    {
        using var context = _contextFactory.CreateDbContext();
        var query = context.Set<Models.Notification>()
            .Where(n => n.ReceiverId == userId && !n.IsRead);
        if (!string.IsNullOrWhiteSpace(copropertyId))
            query = query.Where(n => n.CopropertyId == copropertyId);
        var unread = await query.ToListAsync();
        foreach (var n in unread)
        {
            n.IsRead = true;
            n.UpdatedAt = DateTime.UtcNow;
        }
        await context.SaveChangesAsync();
    }
}
