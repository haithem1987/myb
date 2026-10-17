using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Myb.Notification.Controllers;
using Myb.Notification.Dtos;
using Myb.Notification.Models;
using Myb.Notification.Security;
using Myb.Notification.Services;
using System.Security.Claims;

namespace Myb.Notification.Tests.Communication;

/// <summary>
/// Security tests for CommunicationController.
/// Requires: CommunicationController concrete class in Myb.Notification.Controllers.
/// </summary>
public class CommunicationControllerTests
{
    private readonly FakeCommunicationLogService _logService = new();
    private readonly FakeCampaignService _campaignService = new();

    private CommunicationController Controller(ClaimsPrincipal user) =>
        new CommunicationController(_logService, _campaignService, Options.Create(new NotificationSecurityOptions()))
            .WithUser(user);

    private static ClaimsPrincipal Manager(string userId, string copropertyId = "copro-1") =>
        new(new ClaimsIdentity(
        [
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim("azp", "MYB-client"),
            new Claim(ClaimTypes.Role, "coproperty-syndic"),
            new Claim("copropertyId", copropertyId)
        ], "Bearer"));

    private static ClaimsPrincipal SystemAdmin() =>
        new(new ClaimsIdentity(
        [
            new Claim(ClaimTypes.NameIdentifier, "admin-1"),
            new Claim("azp", "MYB-client"),
            new Claim(ClaimTypes.Role, "system-admin")
        ], "Bearer"));

    private static ClaimsPrincipal Unauthenticated() => new(new ClaimsIdentity());

    [Fact]
    public async Task GetLogs_RequiresManagerRole_UnauthenticatedIsForbidden()
    {
        var anon = Unauthenticated();
        var result = await Controller(anon).GetLogs(new LogFilterDto(CopropertyId: "copro-1"));
        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task GetLogs_ManagerCanQueryWithCopropertyId()
    {
        var manager = Manager("mgr-1", "copro-1");
        var result = await Controller(manager).GetLogs(new LogFilterDto(CopropertyId: "copro-1"));
        Assert.IsNotType<ForbidResult>(result);
    }

    [Fact]
    public async Task GetLogs_SystemAdminCanQueryAllCoproperties()
    {
        var admin = SystemAdmin();

        var result1 = await Controller(admin).GetLogs(new LogFilterDto(CopropertyId: "copro-1"));
        var result2 = await Controller(admin).GetLogs(new LogFilterDto(CopropertyId: "copro-99"));
        var resultNoFilter = await Controller(admin).GetLogs(new LogFilterDto());

        Assert.IsNotType<ForbidResult>(result1);
        Assert.IsNotType<ForbidResult>(result2);
        Assert.IsNotType<ForbidResult>(resultNoFilter);
    }

    [Fact]
    public async Task GetStats_RequiresManagerOrAdminRole()
    {
        var manager = Manager("mgr-1", "copro-1");
        var admin = SystemAdmin();
        var anon = Unauthenticated();

        Assert.IsNotType<ForbidResult>(await Controller(manager).GetStats("copro-1"));
        Assert.IsNotType<ForbidResult>(await Controller(admin).GetStats("copro-1"));
        Assert.IsType<ForbidResult>(await Controller(anon).GetStats("copro-1"));
    }

    [Fact]
    public async Task CreateCampaign_ForbiddenForUnauthenticated()
    {
        var request = new CreateCampaignRequest("Test", null, "copro-1", ["InApp"], "msg", null, ["user-1"]);

        var result = await Controller(Unauthenticated()).CreateCampaign(request);

        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task StartCampaign_ForbiddenForNonManager()
    {
        var campaignId = Guid.NewGuid();
        _campaignService.Campaigns[campaignId] = new CampaignDto(
            campaignId, "Campaign", null, "copro-1", "mgr-1",
            "Draft", ["InApp"], 0, 0, 0, null, null, null, DateTimeOffset.UtcNow);

        // A user without Manager role on that coproperty is forbidden
        var plain = TestSupport.User("other-user");
        var result = await Controller(plain).StartCampaign(campaignId);

        Assert.IsType<ForbidResult>(result);
    }
}

// ─── Fakes ───────────────────────────────────────────────────────────────────

internal sealed class FakeCommunicationLogService : ICommunicationLogService
{
    public Task<Guid> LogAsync(CommunicationLog entry) => Task.FromResult(entry.Id);
    public Task UpdateStatusAsync(Guid id, DeliveryStatus status, string? failureReason = null) => Task.CompletedTask;
    public Task<PagedResult<CommunicationLogDto>> QueryLogsAsync(LogFilterDto filter) =>
        Task.FromResult(new PagedResult<CommunicationLogDto>([], 0, filter.Page, filter.Size));
    public Task<CommunicationLogDto?> GetLogAsync(Guid id) => Task.FromResult<CommunicationLogDto?>(null);
    public Task<CommunicationStatsDto> GetStatsAsync(string? copropertyId) =>
        Task.FromResult(new CommunicationStatsDto(0, new ChannelStats(0, 0, 0), new StatusStats(0, 0, 0, 0)));
}

internal sealed class FakeCampaignService : ICampaignService
{
    public Dictionary<Guid, CampaignDto> Campaigns { get; } = [];

    public Task<CampaignDto> CreateCampaignAsync(CreateCampaignRequest request, string createdBy)
    {
        var dto = new CampaignDto(Guid.NewGuid(), request.Name, request.Description, request.CopropertyId,
            createdBy, "Draft", request.Channels, request.RecipientIds.Length, 0, 0, null, null, null, DateTimeOffset.UtcNow);
        Campaigns[dto.Id] = dto;
        return Task.FromResult(dto);
    }

    public Task<PagedResult<CampaignDto>> GetCampaignsAsync(CampaignFilterDto filter) =>
        Task.FromResult(new PagedResult<CampaignDto>([], 0, filter.Page, filter.Size));

    public Task<CampaignDto?> GetCampaignAsync(Guid id) =>
        Task.FromResult(Campaigns.GetValueOrDefault(id));

    public Task StartCampaignAsync(Guid id) => Task.CompletedTask;
    public Task CancelCampaignAsync(Guid id) => Task.CompletedTask;
    public Task<PagedResult<CommunicationLogDto>> GetCampaignLogsAsync(Guid campaignId, int page, int size) =>
        Task.FromResult(new PagedResult<CommunicationLogDto>([], 0, page, size));
}
