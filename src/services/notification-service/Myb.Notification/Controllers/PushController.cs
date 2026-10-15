using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Myb.Notification.Configuration;
using Myb.Notification.Security;
using Myb.Notification.Services;

namespace Myb.Notification.Controllers;

/// <summary>Web Push subscriptions of the signed-in user. The user is always taken from the
/// access token, never from the request.</summary>
[ApiController]
[Route("api/push")]
public class PushController : ControllerBase
{
    private readonly IPushSubscriptionStore _store;
    private readonly IPushQueue _pushQueue;
    private readonly PushOptions _options;

    public PushController(IPushSubscriptionStore store, IPushQueue pushQueue, IOptions<PushOptions> options)
    {
        _store = store;
        _pushQueue = pushQueue;
        _options = options.Value;
    }

    [HttpGet("vapid-public-key")]
    public IActionResult GetVapidPublicKey() =>
        _options.IsConfigured
            ? Ok(new { publicKey = _options.VapidPublicKey })
            : StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = "Push notifications are disabled." });

    [HttpPost("subscriptions")]
    public async Task<IActionResult> Subscribe([FromBody] PushSubscriptionRequest req)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Forbid();
        if (!IsValidEndpoint(req.Endpoint, _options.AllowedEndpointHosts))
            return BadRequest(new { message = "Invalid push endpoint." });

        var userAgent = req.UserAgent ?? Request.Headers.UserAgent.ToString();
        await _store.UpsertAsync(userId, req.Endpoint, req.Keys.P256dh, req.Keys.Auth,
            string.IsNullOrWhiteSpace(userAgent) ? null : userAgent[..Math.Min(userAgent.Length, 256)]);
        return NoContent();
    }

    [HttpDelete("subscriptions")]
    public async Task<IActionResult> Unsubscribe([FromBody] PushUnsubscribeRequest req)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Forbid();
        await _store.RemoveAsync(userId, req.Endpoint);
        return NoContent();
    }

    [HttpPost("test")]
    public IActionResult SendTest([FromQuery] string? language = null)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Forbid();
        if (!_options.IsConfigured)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = "Push notifications are disabled." });

        var english = language?.StartsWith("en", StringComparison.OrdinalIgnoreCase) == true;
        _pushQueue.Enqueue(new PushJob(
            userId, Guid.NewGuid().ToString(), NotificationService.PushTitle,
            english ? "Notifications enabled ✅" : "Notifications activées ✅",
            NotificationService.DefaultPushUrl, null, PushUrgency.Normal));
        return Accepted();
    }

    /// <summary>Only HTTPS endpoints of known push services are accepted, so a subscription can
    /// never make this service call an internal or arbitrary URL.</summary>
    internal static bool IsValidEndpoint(string? endpoint, IEnumerable<string> allowedHosts) =>
        endpoint is { Length: <= 2048 } &&
        Uri.TryCreate(endpoint, UriKind.Absolute, out var uri) &&
        uri.Scheme == Uri.UriSchemeHttps &&
        uri.IsDefaultPort &&
        allowedHosts.Any(host =>
            uri.Host.Equals(host, StringComparison.OrdinalIgnoreCase) ||
            uri.Host.EndsWith("." + host, StringComparison.OrdinalIgnoreCase));

    public record PushSubscriptionKeys([Required] string P256dh, [Required] string Auth);
    public record PushSubscriptionRequest([Required] string Endpoint, [Required] PushSubscriptionKeys Keys, string? UserAgent = null);
    public record PushUnsubscribeRequest([Required] string Endpoint);
}
