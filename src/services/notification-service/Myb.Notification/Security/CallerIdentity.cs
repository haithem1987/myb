using System.Security.Claims;

namespace Myb.Notification.Security;

/// <summary>Keycloak clients whose client-credentials tokens may act on behalf of any user.</summary>
public sealed class NotificationSecurityOptions
{
    public const string SectionName = "NotificationSecurity";

    public string[] TrustedServiceClients { get; set; } = ["myb-backend"];
}

public static class CallerIdentity
{
    public static string? GetUserId(this ClaimsPrincipal user) =>
        user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("sub")?.Value;

    /// <summary>
    /// A service token is issued to a confidential backend client (azp). End users sign in
    /// through the public front-end client and therefore never carry a trusted azp.
    /// </summary>
    public static bool IsTrustedService(this ClaimsPrincipal user, NotificationSecurityOptions options)
    {
        var clientId = user.FindFirst("azp")?.Value ?? user.FindFirst("client_id")?.Value;
        return !string.IsNullOrWhiteSpace(clientId) &&
            options.TrustedServiceClients.Contains(clientId, StringComparer.OrdinalIgnoreCase);
    }

    /// <summary>A user may only act on their own notifications; trusted services may act on anyone's.</summary>
    public static bool CanActFor(this ClaimsPrincipal user, string userId, NotificationSecurityOptions options) =>
        user.IsTrustedService(options) || string.Equals(user.GetUserId(), userId, StringComparison.Ordinal);
}
