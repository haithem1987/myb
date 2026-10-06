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
        await _notificationService.SendNotificationAsync(
            req.SenderId, req.ReceiverId, req.Message, req.CopropertyId);
        return Ok();
    }
    
    [HttpGet("{userId}")]
    public async Task<IActionResult> GetByReceiverId(
        string userId, [FromQuery] string? copropertyId = null)
    {
        var notifications = await _notificationService.GetNotificationsAsync(userId, copropertyId);
        return Ok(notifications);
    }

    [HttpPost("email")]
    [Authorize]
    public async Task<IActionResult> SendEmail([FromBody] EmailNotificationRequest req)
    {
        await _notificationService.SendEmailNotificationAsync(
            req.ToEmail, req.Subject, req.HtmlBody, req.Language);
        return Ok(new { message = "Email queued successfully" });
    }

    [HttpPut("{notificationId}/read")]
    public async Task<IActionResult> MarkAsRead(string notificationId)
    {
        await _notificationService.MarkAsReadAsync(notificationId);
        return Ok();
    }

    [HttpPut("read-all/{userId}")]
    public async Task<IActionResult> MarkAllAsRead(
        string userId, [FromQuery] string? copropertyId = null)
    {
        await _notificationService.MarkAllAsReadAsync(userId, copropertyId);
        return Ok();
    }

    public record NotificationRequest(
        string SenderId, string ReceiverId, string Message, string? CopropertyId = null);
    public record EmailNotificationRequest(
        string ToEmail, string Subject, string HtmlBody, string? Language = null);
}
