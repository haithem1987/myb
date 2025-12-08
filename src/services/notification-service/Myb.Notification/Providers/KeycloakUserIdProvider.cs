using System.Security.Claims;

namespace Myb.Notification.Providers;

using Microsoft.AspNetCore.SignalR;

public class KeycloakUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
    {
        var userId = connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Console.WriteLine($"UserID : {userId}");
        return userId;
    }
}