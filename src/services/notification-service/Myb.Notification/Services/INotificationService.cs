namespace Myb.Notification.Services;

public interface INotificationService
{
    /// <param name="push">Also deliver as a Web Push to the receiver's devices (best effort).</param>
    /// <param name="url">Same-origin path opened when the push notification is clicked.</param>
    Task SendNotificationAsync(
        string senderId, string receiverId, string message, string? copropertyId = null,
        bool push = false, string? url = null, PushUrgency urgency = PushUrgency.Normal);
    Task SendEmailNotificationAsync(string receiverEmail, string subject, string htmlBody,
        string? language = null, string? copropertyId = null, string? recipientId = null);
    /// <summary>Sends a WhatsApp template using the coproperty's own credentials (best effort — never throws).
    /// Falls back to global config when copropertyId has no stored config.
    /// Returns false when no config is available or the API call fails.</summary>
    Task<bool> SendWhatsAppAsync(string copropertyId, string toPhone, WhatsAppTemplate template, params string[] parameters);
    Task<List<Models.Notification>> GetNotificationsAsync(string userId, string? copropertyId = null);
    /// <summary>Marks the notification as read when it belongs to <paramref name="receiverId"/>
    /// (any receiver when null). Returns false when no such notification exists.</summary>
    Task<bool> MarkAsReadAsync(string notificationId, string? receiverId);
    Task MarkAllAsReadAsync(string userId, string? copropertyId = null);
}
