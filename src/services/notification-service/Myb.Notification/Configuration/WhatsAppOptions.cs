namespace Myb.Notification.Configuration;

public sealed class WhatsAppOptions
{
    public const string SectionName = "WhatsApp";

    public bool Enabled { get; set; } = false;
    public string PhoneNumberId { get; set; } = "";
    public string AccessToken { get; set; } = "";
    public string ApiVersion { get; set; } = "v19.0";
    /// <summary>Token Meta uses to verify our webhook registration (set once, stored as a secret).</summary>
    public string WebhookVerifyToken { get; set; } = "";

    public bool IsConfigured =>
        Enabled && !string.IsNullOrWhiteSpace(PhoneNumberId) && !string.IsNullOrWhiteSpace(AccessToken);
}
