namespace Myb.Notification.Models;

public class CopropertyWhatsAppConfig
{
    public string CopropertyId { get; set; } = "";
    public string PhoneNumberId { get; set; } = "";
    public string AccessToken { get; set; } = "";
    public string BusinessAccountId { get; set; } = "";
    public string ApiVersion { get; set; } = "v19.0";
    public bool Enabled { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
