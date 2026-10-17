using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Myb.Notification.Configuration;

namespace Myb.Notification.Controllers;

/// <summary>
/// Handles the Meta WhatsApp webhook lifecycle:
///   GET  /api/whatsapp/webhook  — challenge-response to register the webhook with Meta
///   POST /api/whatsapp/webhook  — incoming status updates (delivered, read) from Meta
/// Both endpoints are anonymous because Meta does not send a bearer token.
/// </summary>
[ApiController]
[Route("api/whatsapp/webhook")]
[AllowAnonymous]
public class WhatsAppWebhookController : ControllerBase
{
    private readonly WhatsAppOptions _options;
    private readonly ILogger<WhatsAppWebhookController> _logger;

    public WhatsAppWebhookController(
        IOptions<WhatsAppOptions> options,
        ILogger<WhatsAppWebhookController> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    /// <summary>Meta GET verification handshake.</summary>
    [HttpGet]
    public IActionResult Verify(
        [FromQuery(Name = "hub.mode")]         string? mode,
        [FromQuery(Name = "hub.verify_token")] string? token,
        [FromQuery(Name = "hub.challenge")]    string? challenge)
    {
        if (mode == "subscribe"
            && !string.IsNullOrWhiteSpace(_options.WebhookVerifyToken)
            && token == _options.WebhookVerifyToken
            && !string.IsNullOrWhiteSpace(challenge))
        {
            return Ok(challenge);
        }

        _logger.LogWarning("WhatsApp webhook verification failed (mode={Mode})", mode);
        return Forbid();
    }

    /// <summary>Meta POST status callbacks (delivered / read receipts).</summary>
    [HttpPost]
    public IActionResult Status([FromBody] object payload)
    {
        _logger.LogDebug("WhatsApp status update received");
        // Future: parse delivery/read statuses and update notification records.
        return Ok();
    }
}
