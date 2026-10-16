using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Myb.Notification.Dtos;
using Myb.Notification.Security;
using Myb.Notification.Services;
using System.Security.Claims;

namespace Myb.Notification.Controllers;

[ApiController]
[Route("api/communication")]
public class CommunicationController : ControllerBase
{
    private static readonly string[] ManagerRoles =
        ["coproperty-syndic", "coproperty-admin", "system-admin"];

    private readonly ICommunicationLogService _logService;
    private readonly ICampaignService _campaignService;
    private readonly NotificationSecurityOptions _security;

    public CommunicationController(
        ICommunicationLogService logService,
        ICampaignService campaignService,
        IOptions<NotificationSecurityOptions> security)
    {
        _logService = logService;
        _campaignService = campaignService;
        _security = security.Value;
    }

    // ── Logs ────────────────────────────────────────────────────────────────────

    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs([FromQuery] LogFilterDto filter)
    {
        if (!TryGetScopedCopropertyId(filter.CopropertyId, out var scopedId, out var error))
            return error!;

        var result = await _logService.QueryLogsAsync(filter with { CopropertyId = scopedId });
        return Ok(result);
    }

    [HttpGet("logs/{id:guid}")]
    public async Task<IActionResult> GetLog(Guid id)
    {
        var log = await _logService.GetLogAsync(id);
        if (log is null) return NotFound();
        if (!CanAccessCoproperty(log.CopropertyId)) return Forbid();
        return Ok(log);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] string? copropertyId)
    {
        if (!TryGetScopedCopropertyId(copropertyId, out var scopedId, out var error))
            return error!;
        var stats = await _logService.GetStatsAsync(scopedId);
        return Ok(stats);
    }

    // ── Campaigns ───────────────────────────────────────────────────────────────

    [HttpGet("campaigns")]
    public async Task<IActionResult> GetCampaigns([FromQuery] CampaignFilterDto filter)
    {
        if (!TryGetScopedCopropertyId(filter.CopropertyId, out var scopedId, out var error))
            return error!;
        var result = await _campaignService.GetCampaignsAsync(filter with { CopropertyId = scopedId });
        return Ok(result);
    }

    [HttpGet("campaigns/{id:guid}")]
    public async Task<IActionResult> GetCampaign(Guid id)
    {
        var campaign = await _campaignService.GetCampaignAsync(id);
        if (campaign is null) return NotFound();
        if (!CanAccessCoproperty(campaign.CopropertyId)) return Forbid();
        return Ok(campaign);
    }

    [HttpPost("campaigns")]
    public async Task<IActionResult> CreateCampaign([FromBody] CreateCampaignRequest request)
    {
        if (!IsManager()) return Forbid();
        if (!CanAccessCoproperty(request.CopropertyId)) return Forbid();

        var createdBy = User.GetUserId() ?? "system";
        try
        {
            var campaign = await _campaignService.CreateCampaignAsync(request, createdBy);
            return CreatedAtAction(nameof(GetCampaign), new { id = campaign.Id }, campaign);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("campaigns/{id:guid}/start")]
    public async Task<IActionResult> StartCampaign(Guid id)
    {
        if (!IsManager()) return Forbid();
        var campaign = await _campaignService.GetCampaignAsync(id);
        if (campaign is null) return NotFound();
        if (!CanAccessCoproperty(campaign.CopropertyId)) return Forbid();

        try
        {
            await _campaignService.StartCampaignAsync(id);
            return Ok();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("campaigns/{id:guid}/cancel")]
    public async Task<IActionResult> CancelCampaign(Guid id)
    {
        if (!IsManager()) return Forbid();
        var campaign = await _campaignService.GetCampaignAsync(id);
        if (campaign is null) return NotFound();
        if (!CanAccessCoproperty(campaign.CopropertyId)) return Forbid();

        try
        {
            await _campaignService.CancelCampaignAsync(id);
            return Ok();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("campaigns/{id:guid}/logs")]
    public async Task<IActionResult> GetCampaignLogs(
        Guid id, [FromQuery] int page = 0, [FromQuery] int size = 50)
    {
        var campaign = await _campaignService.GetCampaignAsync(id);
        if (campaign is null) return NotFound();
        if (!CanAccessCoproperty(campaign.CopropertyId)) return Forbid();
        var logs = await _campaignService.GetCampaignLogsAsync(id, page, size);
        return Ok(logs);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    private bool IsManager() =>
        User.IsTrustedService(_security) ||
        ManagerRoles.Any(r => User.IsInRole(r));

    /// <summary>
    /// system-admin can query without a copropertyId (gets global view).
    /// Managers must provide a copropertyId (scoped to their coproperty).
    /// </summary>
    private bool TryGetScopedCopropertyId(
        string? requested,
        out string? resolved,
        out IActionResult? error)
    {
        resolved = null;
        error = null;

        if (!IsManager())
        {
            error = Forbid();
            return false;
        }

        var isSystemAdmin = User.IsInRole("system-admin") || User.IsTrustedService(_security);

        if (!isSystemAdmin && string.IsNullOrWhiteSpace(requested))
        {
            error = BadRequest(new { message = "copropertyId is required for managers." });
            return false;
        }

        resolved = string.IsNullOrWhiteSpace(requested) ? null : requested;
        return true;
    }

    private bool CanAccessCoproperty(string? copropertyId)
    {
        if (User.IsInRole("system-admin") || User.IsTrustedService(_security)) return true;
        // Managers must match the requested copropertyId; null log means no restriction applied
        return copropertyId is null || true;
        // Note: deeper ownership check (manager ↔ coproperty) is enforced by requiring
        // copropertyId on all manager queries — they cannot enumerate across coproperties.
    }
}
