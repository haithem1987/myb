using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Myb.Common.Messaging;
using Myb.Common.Messaging.Models;
using Myb.Notification.Hubs;

namespace Myb.Notification.Services;

public class NotificationService : INotificationService
{
    private readonly IDbContextFactory<NotificationContext> _contextFactory;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly IEmailPublisher _emailPublisher;

    public NotificationService(
        IDbContextFactory<NotificationContext> contextFactory,
        IHubContext<NotificationHub> hubContext,
        IEmailPublisher emailPublisher)
    {
        _contextFactory = contextFactory;
        _hubContext = hubContext;
        _emailPublisher = emailPublisher;
    }

    public async Task SendNotificationAsync(
        string senderId, string receiverId, string message, string? copropertyId = null)
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
        string receiverEmail, string subject, string htmlBody, string? language = null)
    {
        await _emailPublisher.PublishAsync(new EmailMessage
        {
            To = receiverEmail,
            Subject = subject,
            Language = language?.StartsWith("en", StringComparison.OrdinalIgnoreCase) == true ? "en" : "fr",
            HtmlBody = htmlBody,
            Source = "notification-service"
        });
    }

    public async Task MarkAsReadAsync(string notificationId)
    {
        using var context = _contextFactory.CreateDbContext();
        var notification = await context.Set<Models.Notification>().FindAsync(notificationId);
        if (notification != null)
        {
            notification.IsRead = true;
            notification.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();
        }
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
