using Myb.Notification.Dtos;
using Myb.Notification.Models;
using Myb.Notification.Services;

namespace Myb.Notification.Tests.Communication;

/// <summary>
/// Unit tests for CommunicationLogService using in-memory EF.
/// Requires: CommunicationLogService concrete class + NotificationContext.CommunicationLogs DbSet.
/// </summary>
public class CommunicationLogServiceTests
{
    private static CommunicationLogService NewService() =>
        new(TestSupport.NewDatabase());

    private static CommunicationLog Log(
        string recipientId = "user-1",
        string? copropertyId = null,
        CommunicationChannel channel = CommunicationChannel.InApp,
        DeliveryStatus status = DeliveryStatus.Sent) =>
        new()
        {
            RecipientId = recipientId,
            CopropertyId = copropertyId,
            Channel = channel,
            Status = status,
            Subject = "Test message"
        };

    [Fact]
    public async Task LogAsync_StoresCommunicationLog()
    {
        var svc = NewService();
        var entry = Log("owner-1", "copro-1");

        var id = await svc.LogAsync(entry);

        Assert.NotEqual(Guid.Empty, id);
        var stored = await svc.GetLogAsync(id);
        Assert.NotNull(stored);
        Assert.Equal("owner-1", stored.RecipientId);
        Assert.Equal("copro-1", stored.CopropertyId);
    }

    [Fact]
    public async Task QueryLogsAsync_FiltersByChannel()
    {
        var svc = NewService();
        await svc.LogAsync(Log(channel: CommunicationChannel.Email));
        await svc.LogAsync(Log(channel: CommunicationChannel.Push));
        await svc.LogAsync(Log(channel: CommunicationChannel.InApp));

        var result = await svc.QueryLogsAsync(new LogFilterDto(Channel: "Email"));

        Assert.Equal(1, result.Total);
        Assert.Single(result.Items);
        Assert.Equal("Email", result.Items[0].Channel);
    }

    [Fact]
    public async Task QueryLogsAsync_FiltersByCopropertyId()
    {
        var svc = NewService();
        await svc.LogAsync(Log(copropertyId: "copro-A"));
        await svc.LogAsync(Log(copropertyId: "copro-A"));
        await svc.LogAsync(Log(copropertyId: "copro-B"));

        var result = await svc.QueryLogsAsync(new LogFilterDto(CopropertyId: "copro-A"));

        Assert.Equal(2, result.Total);
        Assert.All(result.Items, item => Assert.Equal("copro-A", item.CopropertyId));
    }

    [Fact]
    public async Task QueryLogsAsync_PaginationWorks()
    {
        var svc = NewService();
        for (var i = 0; i < 5; i++)
            await svc.LogAsync(Log());

        var page0 = await svc.QueryLogsAsync(new LogFilterDto(Page: 0, Size: 2));
        var page1 = await svc.QueryLogsAsync(new LogFilterDto(Page: 1, Size: 2));

        Assert.Equal(5, page0.Total);
        Assert.Equal(2, page0.Items.Count);
        Assert.Equal(2, page1.Items.Count);
        Assert.Empty(page0.Items.Select(i => i.Id).Intersect(page1.Items.Select(i => i.Id)));
    }

    [Fact]
    public async Task GetStatsAsync_ReturnsCorrectCounts()
    {
        var svc = NewService();
        await svc.LogAsync(Log(channel: CommunicationChannel.InApp, status: DeliveryStatus.Delivered));
        await svc.LogAsync(Log(channel: CommunicationChannel.Push, status: DeliveryStatus.Delivered));
        await svc.LogAsync(Log(channel: CommunicationChannel.Push, status: DeliveryStatus.Failed));
        await svc.LogAsync(Log(channel: CommunicationChannel.Email, status: DeliveryStatus.Sent));

        var stats = await svc.GetStatsAsync(copropertyId: null);

        Assert.Equal(4, stats.Total);
        Assert.Equal(1, stats.ByChannel.InApp);
        Assert.Equal(2, stats.ByChannel.Push);
        Assert.Equal(1, stats.ByChannel.Email);
        Assert.Equal(1, stats.ByStatus.Sent);
        Assert.Equal(2, stats.ByStatus.Delivered);
        Assert.Equal(1, stats.ByStatus.Failed);
    }
}
