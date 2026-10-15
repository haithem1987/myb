using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using Myb.Notification.Security;
using Myb.Notification.Services;

namespace Myb.Notification.Controllers;

using Microsoft.AspNetCore.Mvc;


[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    public const int MaxUserMessageLength = 1000;

    private readonly INotificationService _notificationService;
    private readonly NotificationSecurityOptions _security;

    public NotificationsController(
        INotificationService notificationService,
        IOptions<NotificationSecurityOptions> security)
    {
        _notificationService = notificationService;
        _security = security.Value;
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] NotificationRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.ReceiverId) || string.IsNullOrWhiteSpace(req.Message))
            return BadRequest();

        if (User.IsTrustedService(_security))
        {
            await _notificationService.SendNotificationAsync(
                req.SenderId, req.ReceiverId, req.Message, req.CopropertyId,
                push: req.Push ?? true, url: req.Url, urgency: ParseUrgency(req.Urgency));
            return Ok();
        }

        // End users may still notify each other in-app (e.g. timesheets), but the sender is
        // always the caller and the message never reaches anyone's phone as a push.
        var callerId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(callerId)) return Forbid();
        if (req.Message.Length > MaxUserMessageLength) return BadRequest();
        await _notificationService.SendNotificationAsync(
            callerId, req.ReceiverId, req.Message, req.CopropertyId, push: false);
        return Ok();
    }

    [HttpGet("{userId}")]
    public async Task<IActionResult> GetByReceiverId(
        string userId, [FromQuery] string? copropertyId = null)
    {
        if (!User.CanActFor(userId, _security)) return Forbid();
        var notifications = await _notificationService.GetNotificationsAsync(userId, copropertyId);
        return Ok(notifications);
    }

    [HttpPost("email")]
    [Authorize]
    public async Task<IActionResult> SendEmail([FromBody] EmailNotificationRequest req)
    {
        // Arbitrary recipients and HTML: never let an end-user token relay e-mail.
        if (!User.IsTrustedService(_security)) return Forbid();
        await _notificationService.SendEmailNotificationAsync(
            req.ToEmail, req.Subject, req.HtmlBody, req.Language);
        return Ok(new { message = "Email queued successfully" });
    }

    [HttpPut("{notificationId}/read")]
    public async Task<IActionResult> MarkAsRead(string notificationId)
    {
        var receiverId = User.IsTrustedService(_security) ? null : User.GetUserId();
        if (receiverId == null && !User.IsTrustedService(_security)) return Forbid();
        return await _notificationService.MarkAsReadAsync(notificationId, receiverId)
            ? Ok()
            : NotFound();
    }

    [HttpPut("read-all/{userId}")]
    public async Task<IActionResult> MarkAllAsRead(
        string userId, [FromQuery] string? copropertyId = null)
    {
        if (!User.CanActFor(userId, _security)) return Forbid();
        await _notificationService.MarkAllAsReadAsync(userId, copropertyId);
        return Ok();
    }

    private static PushUrgency ParseUrgency(string? urgency) =>
        string.Equals(urgency, "high", StringComparison.OrdinalIgnoreCase) ? PushUrgency.High : PushUrgency.Normal;

    /// <param name="Push">Trusted services only; defaults to true.</param>
    /// <param name="Url">Same-origin path opened when the push notification is clicked.</param>
    /// <param name="Urgency">"normal" (default) or "high".</param>
    public record NotificationRequest(
        string SenderId, string ReceiverId, string Message, string? CopropertyId = null,
        bool? Push = null, string? Url = null, string? Urgency = null);
    public record EmailNotificationRequest(
        string ToEmail, string Subject, string HtmlBody, string? Language = null);
}
