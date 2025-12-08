namespace Myb.Notification.Services;

public interface INotificationService
{
    Task SendNotificationAsync(string senderId, string receiverId, string message);
    Task<List<Models.Notification>> GetNotificationsAsync(string userId);

}
