using Myb.Notification.Dtos;
using Myb.Notification.Models;
using Myb.Notification.Services;

namespace Myb.Notification.Tests.Communication;

/// <summary>
/// Unit tests for CampaignService.
/// Uses in-memory EF via TestSupport.NewDatabase() with a real CommunicationLogService for log assertions.
/// </summary>
public class CampaignServiceTests
{
    private static (CampaignService Campaign, CommunicationLogService Log) NewServices(INotificationService? notif = null)
    {
        var db = TestSupport.NewDatabase();
        var log = new CommunicationLogService(db);
        return (new CampaignService(db, notif ?? new RecordingNotificationService(), log), log);
    }

    private static CreateCampaignRequest Request(
        string name = "Assemblée générale",
        string copropertyId = "copro-1",
        string[]? channels = null,
        string message = "Rappel : AG le 20 nov.",
        string[]? recipientIds = null) =>
        new(name, null, copropertyId, channels ?? ["InApp"], message, "Rappel AG",
            recipientIds ?? ["owner-1", "owner-2"]);

    [Fact]
    public async Task CreateCampaign_CreatesDraftCampaign()
    {
        var (svc, _) = NewServices();

        var dto = await svc.CreateCampaignAsync(Request(), "mgr-1");

        Assert.NotEqual(Guid.Empty, dto.Id);
        Assert.Equal("Assemblée générale", dto.Name);
        Assert.Equal("Draft", dto.Status);
        Assert.Equal("mgr-1", dto.CreatedBy);
        Assert.Equal("copro-1", dto.CopropertyId);
        Assert.Equal(2, dto.TotalRecipients);
    }

    [Fact]
    public async Task StartCampaign_SendsToAllRecipients()
    {
        var notif = new RecordingNotificationService();
        var (svc, _) = NewServices(notif);
        var campaign = await svc.CreateCampaignAsync(
            Request(channels: ["InApp"], recipientIds: ["owner-1", "owner-2", "owner-3"]), "mgr-1");

        await svc.StartCampaignAsync(campaign.Id);

        var updated = await svc.GetCampaignAsync(campaign.Id);
        Assert.NotNull(updated);
        Assert.Equal("Completed", updated.Status);
        Assert.Equal(3, updated.SentCount);
        Assert.Equal(3, notif.SentNotifications.Count);
    }

    [Fact]
    public async Task CancelCampaign_StopsRunningCampaign()
    {
        var (svc, _) = NewServices();
        var campaign = await svc.CreateCampaignAsync(Request(), "mgr-1");

        await svc.CancelCampaignAsync(campaign.Id);

        var updated = await svc.GetCampaignAsync(campaign.Id);
        Assert.NotNull(updated);
        Assert.Equal("Cancelled", updated.Status);
    }

    [Fact]
    public async Task StartCampaign_LogsEachDelivery()
    {
        var (svc, log) = NewServices();
        var campaign = await svc.CreateCampaignAsync(
            Request(channels: ["InApp"], recipientIds: ["owner-1", "owner-2"]), "mgr-1");

        await svc.StartCampaignAsync(campaign.Id);

        var logs = await svc.GetCampaignLogsAsync(campaign.Id, 0, 100);
        Assert.Equal(2, logs.Total);
        Assert.All(logs.Items, item => Assert.Equal(campaign.Id, item.CampaignId));
        Assert.All(logs.Items, item => Assert.Equal("Sent", item.Status));
    }
}
