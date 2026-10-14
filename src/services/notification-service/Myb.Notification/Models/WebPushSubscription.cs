using System.ComponentModel.DataAnnotations;

namespace Myb.Notification.Models;

/// <summary>One browser/device subscribed to Web Push for a user.</summary>
public class WebPushSubscription
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string UserId { get; set; } = "";

    [Required]
    public string Endpoint { get; set; } = "";

    [Required]
    public string P256dh { get; set; } = "";

    [Required]
    public string Auth { get; set; } = "";

    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastSuccessAt { get; set; }
    public int FailureCount { get; set; }
}
