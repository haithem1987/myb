using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Myb.Notification.Hubs;
using Myb.Notification.Services;

namespace Myb.Notification.Controllers;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;


[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] NotificationRequest req)
    {
        await _notificationService.SendNotificationAsync(req.SenderId, req.ReceiverId, req.Message);
        return Ok();
    }
    
    [HttpGet("{userId}")]
    public async Task<IActionResult> GetByReceiverId(string userId)
    {
        var notifications = await _notificationService.GetNotificationsAsync(userId);
        return Ok(notifications);
    }

    public record NotificationRequest(string SenderId,string ReceiverId, string Message);
}