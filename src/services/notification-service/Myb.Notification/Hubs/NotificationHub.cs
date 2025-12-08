using System.Runtime.InteropServices.JavaScript;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Myb.Notification.Hubs;
 
[Authorize]
public class NotificationHub : Hub
{
    public override Task OnConnectedAsync()
    {
        if (Context.User?.Identity?.IsAuthenticated != true)
        {
            Console.WriteLine("User is not authenticated");
             return Task.CompletedTask;;
        }
        Console.WriteLine($"Context user: {Context.User}");
        foreach (var claim in Context.User.Claims)
        {
            Console.WriteLine($"Claim: {claim.Type} = {claim.Value}");
        }

        // Optionally log user connection
        var userId = Context.UserIdentifier;
        Console.WriteLine($"User connected >dsf>>>>>: {userId}");
        return base.OnConnectedAsync();
    }
    public async Task SendToUser(string userId, string message)
    {
        await Clients.User(userId).SendAsync("ReceiveNotification", message);
    }
}