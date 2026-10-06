namespace Myb.Notification.Services;

public interface INotificationService
{
    Task SendNotificationAsync(string senderId, string receiverId, string message, string? copropertyId = null);
    Task SendEmailNotificationAsync(string receiverEmail, string subject, string htmlBody, string? language = null);
    Task<List<Models.Notification>> GetNotificationsAsync(string userId, string? copropertyId = null);
    Task MarkAsReadAsync(string notificationId);
    Task MarkAllAsReadAsync(string userId, string? copropertyId = null);
}
