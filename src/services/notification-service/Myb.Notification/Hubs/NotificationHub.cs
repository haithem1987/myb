using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Myb.Notification.Hubs;
 
[Authorize]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        if (Context.User?.Identity?.IsAuthenticated != true)
        {
            _logger.LogWarning("Rejected unauthenticated notification hub connection");
            Context.Abort();
            return;
        }

        _logger.LogInformation("Notification hub client connected for user {UserId}", Context.UserIdentifier);
        await base.OnConnectedAsync();
    }
    public async Task SendToUser(string userId, string message)
    {
        await Clients.User(userId).SendAsync("ReceiveNotification", message);
    }
}
