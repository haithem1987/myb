namespace Myb.Notification.Dtos;

public record WhatsAppConfigDto(
    string CopropertyId,
    string PhoneNumberId,
    string BusinessAccountId,
    string ApiVersion,
    bool Enabled,
    DateTime UpdatedAt);

public record UpsertWhatsAppConfigRequest(
    string PhoneNumberId,
    string AccessToken,
    string BusinessAccountId,
    string ApiVersion = "v19.0",
    bool Enabled = true);
