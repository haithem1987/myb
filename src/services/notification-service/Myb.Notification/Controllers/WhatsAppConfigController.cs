using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Myb.Notification.Dtos;
using Myb.Notification.Models;
using Myb.Notification.Security;
using Myb.Notification.Services;

namespace Myb.Notification.Controllers;

/// <summary>
/// Manages per-coproperty WhatsApp Business credentials.
/// Restricted to coproperty-syndic / coproperty-admin / system-admin.
/// The access token is write-only (never returned in GET).
/// </summary>
[ApiController]
[Route("api/coproperty/{copropertyId}/whatsapp-config")]
public class WhatsAppConfigController : ControllerBase
{
    private static readonly string[] ManagerRoles =
        ["coproperty-syndic", "coproperty-admin", "system-admin"];

    private readonly IWhatsAppConfigService _configService;
    private readonly NotificationSecurityOptions _security;

    public WhatsAppConfigController(
        IWhatsAppConfigService configService,
        IOptions<NotificationSecurityOptions> security)
    {
        _configService = configService;
        _security = security.Value;
    }

    [HttpGet]
    public async Task<IActionResult> Get(string copropertyId)
    {
        if (!IsManager()) return Forbid();

        var config = await _configService.GetAsync(copropertyId);
        if (config is null) return NotFound();

        // Never return the access token
        return Ok(new WhatsAppConfigDto(
            config.CopropertyId,
            config.PhoneNumberId,
            config.BusinessAccountId,
            config.ApiVersion,
            config.Enabled,
            config.UpdatedAt));
    }

    [HttpPut]
    public async Task<IActionResult> Upsert(string copropertyId, [FromBody] UpsertWhatsAppConfigRequest request)
    {
        if (!IsManager()) return Forbid();
        if (string.IsNullOrWhiteSpace(request.PhoneNumberId)) return BadRequest("phoneNumberId required");
        if (string.IsNullOrWhiteSpace(request.AccessToken)) return BadRequest("accessToken required");

        await _configService.UpsertAsync(new CopropertyWhatsAppConfig
        {
            CopropertyId = copropertyId,
            PhoneNumberId = request.PhoneNumberId,
            AccessToken = request.AccessToken,
            BusinessAccountId = request.BusinessAccountId,
            ApiVersion = string.IsNullOrWhiteSpace(request.ApiVersion) ? "v19.0" : request.ApiVersion,
            Enabled = request.Enabled,
        });

        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> Delete(string copropertyId)
    {
        if (!IsManager()) return Forbid();
        await _configService.DeleteAsync(copropertyId);
        return NoContent();
    }

    private bool IsManager() =>
        User.IsTrustedService(_security) ||
        ManagerRoles.Any(r => User.IsInRole(r));
}
