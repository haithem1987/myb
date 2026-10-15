namespace Myb.Notification.Configuration;

/// <summary>Web Push (VAPID) settings. Keys are generated once per environment; rotating the
/// private key invalidates every existing browser subscription.</summary>
public sealed class PushOptions
{
    public const string SectionName = "Push";

    public bool Enabled { get; set; } = true;
    public string VapidPublicKey { get; set; } = "";
    public string VapidPrivateKey { get; set; } = "";
    public string Subject { get; set; } = "mailto:support@myb-platform.com";
    /// <summary>Seconds a push service keeps an undelivered message.</summary>
    public int TimeToLiveSeconds { get; set; } = 24 * 60 * 60;
    /// <summary>Consecutive failures after which a subscription is dropped.</summary>
    public int MaxConsecutiveFailures { get; set; } = 10;
    /// <summary>Host suffixes of the browser push services we deliver to (Chrome/Edge/Android via
    /// FCM, Firefox, Safari/iOS, legacy Edge). Anything else is refused at subscription time.</summary>
    public string[] AllowedEndpointHosts { get; set; } =
    [
        "fcm.googleapis.com",
        "push.services.mozilla.com",
        "push.apple.com",
        "notify.windows.com"
    ];

    public bool IsConfigured =>
        Enabled && !string.IsNullOrWhiteSpace(VapidPublicKey) && !string.IsNullOrWhiteSpace(VapidPrivateKey);
}
