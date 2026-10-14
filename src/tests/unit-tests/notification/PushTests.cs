using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Myb.Notification.Configuration;
using Myb.Notification.Controllers;
using Myb.Notification.Services;

namespace Myb.Notification.Tests;

public class PushDispatcherTests
{
    private const string Chrome = "https://fcm.googleapis.com/fcm/send/chrome";
    private const string Firefox = "https://updates.push.services.mozilla.com/wpush/v2/firefox";

    private readonly PushSubscriptionStore _store = new(TestSupport.NewDatabase());
    private readonly FakePushSender _sender = new();
    private readonly PushDispatcher _dispatcher;

    public PushDispatcherTests()
    {
        var options = Options.Create(new PushOptions { VapidPublicKey = "pub", VapidPrivateKey = "priv", MaxConsecutiveFailures = 2 });
        _dispatcher = new PushDispatcher(_store, _sender, options, NullLogger<PushDispatcher>.Instance);
    }

    private static PushJob Job(string body = "Votre paiement a été validé.") =>
        new("owner-1", "6f1c2b3a-0000-4000-8000-1234567890ab", "MYB", body, "/coproperty/c1/owner/invoices", "c1", PushUrgency.High);

    [Fact]
    public async Task DeliversToEveryDeviceOfTheReceiver()
    {
        await _store.UpsertAsync("owner-1", Chrome, "k", "a", null);
        await _store.UpsertAsync("owner-1", Firefox, "k", "a", null);
        await _store.UpsertAsync("someone-else", "https://fcm.googleapis.com/fcm/send/other", "k", "a", null);

        Assert.Null(await _dispatcher.DeliverAsync(Job(), CancellationToken.None));

        Assert.Equal([Chrome, Firefox], _sender.Sent.Select(s => s.Endpoint).Order());
        Assert.All(_sender.Sent, s => Assert.Equal(PushUrgency.High, s.Urgency));
        Assert.All(await _store.GetByUserAsync("owner-1"), s => Assert.NotNull(s.LastSuccessAt));
    }

    [Fact]
    public async Task ExpiredSubscriptionIsDeleted()
    {
        await _store.UpsertAsync("owner-1", Chrome, "k", "a", null);
        _sender.ResultsByEndpoint[Chrome] = PushDeliveryResult.Gone;

        await _dispatcher.DeliverAsync(Job(), CancellationToken.None);

        Assert.Empty(await _store.GetByUserAsync("owner-1"));
    }

    [Fact]
    public async Task OnlyTemporarilyFailedDevicesAreRetried()
    {
        await _store.UpsertAsync("owner-1", Chrome, "k", "a", null);
        await _store.UpsertAsync("owner-1", Firefox, "k", "a", null);
        _sender.ResultsByEndpoint[Firefox] = PushDeliveryResult.Retry;

        var retry = await _dispatcher.DeliverAsync(Job(), CancellationToken.None);

        Assert.NotNull(retry);
        Assert.Equal(1, retry.Attempt);
        var firefoxId = (await _store.GetByUserAsync("owner-1")).Single(s => s.Endpoint == Firefox).Id;
        Assert.Equal([firefoxId], retry.RetrySubscriptionIds!);

        _sender.Sent.Clear();
        await _dispatcher.DeliverAsync(retry, CancellationToken.None);
        Assert.Equal([Firefox], _sender.Sent.Select(s => s.Endpoint));
    }

    [Fact]
    public async Task ExhaustedRetriesCountAsFailuresAndEventuallyDropTheDevice()
    {
        await _store.UpsertAsync("owner-1", Chrome, "k", "a", null);
        _sender.ResultsByEndpoint[Chrome] = PushDeliveryResult.Retry;
        var lastAttempt = Job() with { Attempt = PushDispatcher.RetryDelays.Length };

        Assert.Null(await _dispatcher.DeliverAsync(lastAttempt, CancellationToken.None));
        Assert.Equal(1, Assert.Single(await _store.GetByUserAsync("owner-1")).FailureCount);

        await _dispatcher.DeliverAsync(lastAttempt, CancellationToken.None);
        Assert.Empty(await _store.GetByUserAsync("owner-1"));
    }

    [Fact]
    public void PayloadIsTruncatedAndCarriesTheDeepLink()
    {
        using var payload = JsonDocument.Parse(PushDispatcher.BuildPayload(Job(new string('é', 500))));
        var root = payload.RootElement;

        Assert.Equal(PushDispatcher.MaxBodyLength, root.GetProperty("body").GetString()!.Length);
        Assert.Equal("/coproperty/c1/owner/invoices", root.GetProperty("url").GetString());
        Assert.Equal("c1", root.GetProperty("copropertyId").GetString());
    }

    [Fact]
    public void TopicIsUrlSafeAndAtMost32Characters()
    {
        var topic = PushDispatcher.BuildTopic("6f1c2b3a-0000-4000-8000-1234567890ab");
        Assert.Equal("6f1c2b3a000040008000123456789", topic![..29]);
        Assert.True(topic.Length <= 32);
        Assert.All(topic, c => Assert.True(char.IsLetterOrDigit(c)));
    }
}

public class PushSubscriptionStoreTests
{
    private const string Endpoint = "https://fcm.googleapis.com/fcm/send/shared-tablet";

    [Fact]
    public async Task DeviceMovesToTheAccountNowSignedIn()
    {
        var store = new PushSubscriptionStore(TestSupport.NewDatabase());
        await store.UpsertAsync("previous-owner", Endpoint, "k1", "a1", null);
        await store.UpsertAsync("new-owner", Endpoint, "k2", "a2", null);

        Assert.Empty(await store.GetByUserAsync("previous-owner"));
        var moved = Assert.Single(await store.GetByUserAsync("new-owner"));
        Assert.Equal("k2", moved.P256dh);
    }

    [Fact]
    public async Task UserCanOnlyRemoveTheirOwnDevice()
    {
        var store = new PushSubscriptionStore(TestSupport.NewDatabase());
        await store.UpsertAsync("owner-1", Endpoint, "k", "a", null);

        Assert.False(await store.RemoveAsync("intruder", Endpoint));
        Assert.True(await store.RemoveAsync("owner-1", Endpoint));
        Assert.Empty(await store.GetByUserAsync("owner-1"));
    }
}

public class PushControllerTests
{
    private static readonly string[] Hosts = new PushOptions().AllowedEndpointHosts;

    [Theory]
    [InlineData("https://fcm.googleapis.com/fcm/send/abc")]
    [InlineData("https://updates.push.services.mozilla.com/wpush/v2/abc")]
    [InlineData("https://web.push.apple.com/QGx")]
    [InlineData("https://wns2-par02p.notify.windows.com/w/?token=abc")]
    public void AcceptsBrowserPushServices(string endpoint) =>
        Assert.True(PushController.IsValidEndpoint(endpoint, Hosts));

    [Theory]
    [InlineData("http://fcm.googleapis.com/fcm/send/abc")]
    [InlineData("https://localhost/fcm")]
    [InlineData("https://169.254.169.254/latest/meta-data")]
    [InlineData("https://notification-service:8085/api/Notifications")]
    [InlineData("https://fcm.googleapis.com.evil.example/abc")]
    [InlineData("https://evilfcm.googleapis.com.example/abc")]
    [InlineData("https://fcm.googleapis.com:8443/abc")]
    [InlineData("not a url")]
    [InlineData(null)]
    public void RefusesAnythingElse(string? endpoint) =>
        Assert.False(PushController.IsValidEndpoint(endpoint, Hosts));

    [Fact]
    public async Task SubscriptionIsStoredForTheTokenUserNotTheBody()
    {
        var store = new PushSubscriptionStore(TestSupport.NewDatabase());
        var controller = new PushController(store, new RecordingPushQueue(), Options.Create(new PushOptions()))
            .WithUser(TestSupport.User("owner-1"));

        var result = await controller.Subscribe(new PushController.PushSubscriptionRequest(
            "https://fcm.googleapis.com/fcm/send/abc", new PushController.PushSubscriptionKeys("k", "a")));

        Assert.IsType<NoContentResult>(result);
        Assert.Single(await store.GetByUserAsync("owner-1"));
    }

    [Fact]
    public void TestPushTargetsOnlyTheCaller()
    {
        var queue = new RecordingPushQueue();
        var controller = new PushController(
                new PushSubscriptionStore(TestSupport.NewDatabase()), queue,
                Options.Create(new PushOptions { VapidPublicKey = "pub", VapidPrivateKey = "priv" }))
            .WithUser(TestSupport.User("owner-1"));

        Assert.IsType<AcceptedResult>(controller.SendTest());
        Assert.Equal("owner-1", Assert.Single(queue.Jobs).ReceiverId);
    }

    [Theory]
    [InlineData("/coproperty/c1/owner/charges", "/coproperty/c1/owner/charges")]
    [InlineData("/admin/coproperty/c1/syndic/fund-calls", "/admin/coproperty/c1/syndic/fund-calls")]
    [InlineData("https://evil.example/phish", NotificationService.DefaultPushUrl)]
    [InlineData("//evil.example/phish", NotificationService.DefaultPushUrl)]
    [InlineData("/\\evil.example", NotificationService.DefaultPushUrl)]
    [InlineData(null, NotificationService.DefaultPushUrl)]
    public void PushUrlsStayOnTheMybSite(string? url, string expected) =>
        Assert.Equal(expected, NotificationService.NormalizePushUrl(url));
}
