using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Myb.Common.Repositories;
using Myb.Notification.Hubs;

namespace Myb.Notification.Services;

public class NotificationService : INotificationService
{
    private readonly IDbContextFactory<NotificationContext> _contextFactory;
    private readonly IGenericRepository<string?, Models.Notification, NotificationContext> _notificationRepository;
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationService(
        IGenericRepository<string?, Models.Notification, NotificationContext> notificationRepository,
        IDbContextFactory<NotificationContext> contextFactory,
        IHubContext<NotificationHub> hubContext)
    {
        _notificationRepository = notificationRepository;
        _contextFactory = contextFactory;
        _hubContext = hubContext;
    }

    public async Task SendNotificationAsync(string senderId, string receiverId, string message)
    {
        var notification = new Models.Notification
        {
            SenderId = senderId,
            ReceiverId = receiverId,
            Message = message,
            IsRead = false
        };
        try
        {
            await _notificationRepository.InsertAsync(notification);
            await _hubContext.Clients.User(receiverId).SendAsync("ReceiveNotification", message);
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            throw new InvalidOperationException("Failed to send notification.");
        }
       
    }

    public async Task<List<Models.Notification>> GetNotificationsAsync(string userId)
    {
        try {
            var notifications = _notificationRepository
            .GetAll()
            .Where(n => n.ReceiverId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .ToList();

            return await Task.FromResult(notifications);
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            throw new InvalidOperationException("Failed to send notification.");
        }
    }
}
