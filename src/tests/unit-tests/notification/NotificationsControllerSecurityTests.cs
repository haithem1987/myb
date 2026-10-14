using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Myb.Notification.Controllers;
using Myb.Notification.Security;
using Myb.Notification.Services;

namespace Myb.Notification.Tests;

public class NotificationsControllerSecurityTests
{
    private readonly RecordingNotificationService _service = new();

    private NotificationsController Controller(System.Security.Claims.ClaimsPrincipal user) =>
        new NotificationsController(_service, Options.Create(new NotificationSecurityOptions())).WithUser(user);

    [Fact]
    public async Task ServiceCanNotifyAnyUserAndPushesByDefault()
    {
        var result = await Controller(TestSupport.Service()).Post(new NotificationsController.NotificationRequest(
            "owner-1", "syndic-1", "Paiement reçu", "copro-1", Url: "/admin/coproperty/copro-1/syndic/fund-calls", Urgency: "high"));

        Assert.IsType<OkResult>(result);
        var sent = Assert.Single(_service.SentNotifications);
        Assert.Equal("owner-1", sent.SenderId);
        Assert.Equal("syndic-1", sent.ReceiverId);
        Assert.True(sent.Push);
        Assert.Equal("/admin/coproperty/copro-1/syndic/fund-calls", sent.Url);
        Assert.Equal(PushUrgency.High, sent.Urgency);
    }

    [Fact]
    public async Task UserCannotSpoofSenderNorTriggerPush()
    {
        var result = await Controller(TestSupport.User("intervenant-1")).Post(new NotificationsController.NotificationRequest(
            "someone-else", "manager-1", "Timesheet updated by Ali", Push: true));

        Assert.IsType<OkResult>(result);
        var sent = Assert.Single(_service.SentNotifications);
        Assert.Equal("intervenant-1", sent.SenderId);
        Assert.False(sent.Push);
    }

    [Fact]
    public async Task UserMessageLengthIsCapped()
    {
        var result = await Controller(TestSupport.User("u1")).Post(new NotificationsController.NotificationRequest(
            "u1", "u2", new string('x', NotificationsController.MaxUserMessageLength + 1)));

        Assert.IsType<BadRequestResult>(result);
        Assert.Empty(_service.SentNotifications);
    }

    [Fact]
    public async Task UserCannotReadAnotherUsersNotifications()
    {
        Assert.IsType<ForbidResult>(await Controller(TestSupport.User("u1")).GetByReceiverId("u2"));
        Assert.IsType<OkObjectResult>(await Controller(TestSupport.User("u1")).GetByReceiverId("u1"));
    }

    [Fact]
    public async Task UserCannotMarkAllOfAnotherUserAsRead() =>
        Assert.IsType<ForbidResult>(await Controller(TestSupport.User("u1")).MarkAllAsRead("u2"));

    [Fact]
    public async Task MarkAsReadIsScopedToTheCaller()
    {
        _service.MarkAsReadResult = false;
        var result = await Controller(TestSupport.User("u1")).MarkAsRead("notification-of-u2");

        Assert.IsType<NotFoundResult>(result);
        Assert.Equal(("notification-of-u2", "u1"), _service.MarkedAsRead);
    }

    [Fact]
    public async Task UserCannotRelayEmail()
    {
        var result = await Controller(TestSupport.User("u1")).SendEmail(
            new NotificationsController.EmailNotificationRequest("victim@example.com", "Hi", "<p>x</p>"));

        Assert.IsType<ForbidResult>(result);
        Assert.Equal(0, _service.EmailsSent);
    }

    [Fact]
    public void OnlyConfiguredClientsAreTrusted()
    {
        var options = new NotificationSecurityOptions();
        Assert.True(TestSupport.Service().IsTrustedService(options));
        Assert.False(TestSupport.User("u1").IsTrustedService(options));
        Assert.False(TestSupport.User("u1", "attacker-client").IsTrustedService(options));
    }
}
