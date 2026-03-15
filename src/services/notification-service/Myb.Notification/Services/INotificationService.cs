namespace Myb.Notification.Services;

public interface INotificationService
{
    Task SendNotificationAsync(string senderId, string receiverId, string message);
    Task SendEmailNotificationAsync(string receiverEmail, string subject, string htmlBody);
    Task<List<Models.Notification>> GetNotificationsAsync(string userId);
}
