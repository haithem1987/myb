global using Xunit;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Myb.Notification;
using Myb.Notification.Models;
using Myb.Notification.Services;

namespace Myb.Notification.Tests;

internal static class TestSupport
{
    public const string ServiceClient = "myb-backend";

    public static ClaimsPrincipal User(string userId, string clientId = "MYB-client") =>
        new(new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, userId), new Claim("azp", clientId)], "Bearer"));

    public static ClaimsPrincipal Service() => User("service-account-id", ServiceClient);

    public static T WithUser<T>(this T controller, ClaimsPrincipal user) where T : ControllerBase
    {
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
        return controller;
    }

    public static IDbContextFactory<NotificationContext> NewDatabase() =>
        new InMemoryFactory(Guid.NewGuid().ToString());

    private sealed class InMemoryFactory(string name) : IDbContextFactory<NotificationContext>
    {
        public NotificationContext CreateDbContext() =>
            new(new DbContextOptionsBuilder<NotificationContext>().UseInMemoryDatabase(name).Options);
    }
}

internal sealed class RecordingNotificationService : INotificationService
{
    public record Sent(string SenderId, string ReceiverId, string Message, string? CopropertyId,
        bool Push, string? Url, PushUrgency Urgency);

    public List<Sent> SentNotifications { get; } = [];
    public bool MarkAsReadResult { get; set; } = true;
    public (string Id, string? ReceiverId)? MarkedAsRead { get; private set; }
    public int EmailsSent { get; private set; }

    public Task SendNotificationAsync(string senderId, string receiverId, string message, string? copropertyId = null,
        bool push = false, string? url = null, PushUrgency urgency = PushUrgency.Normal)
    {
        SentNotifications.Add(new Sent(senderId, receiverId, message, copropertyId, push, url, urgency));
        return Task.CompletedTask;
    }

    public Task SendEmailNotificationAsync(string receiverEmail, string subject, string htmlBody, string? language = null)
    {
        EmailsSent++;
        return Task.CompletedTask;
    }

    public Task<List<Models.Notification>> GetNotificationsAsync(string userId, string? copropertyId = null) =>
        Task.FromResult(new List<Models.Notification>());

    public Task<bool> MarkAsReadAsync(string notificationId, string? receiverId)
    {
        MarkedAsRead = (notificationId, receiverId);
        return Task.FromResult(MarkAsReadResult);
    }

    public Task MarkAllAsReadAsync(string userId, string? copropertyId = null) => Task.CompletedTask;
}

internal sealed class FakePushSender : IWebPushSender
{
    public Dictionary<string, PushDeliveryResult> ResultsByEndpoint { get; } = [];
    public List<(string Endpoint, string Payload, PushUrgency Urgency, string? Topic)> Sent { get; } = [];

    public Task<PushDeliveryResult> SendAsync(WebPushSubscription subscription, string payloadJson, PushUrgency urgency,
        string? topic, CancellationToken cancellationToken)
    {
        Sent.Add((subscription.Endpoint, payloadJson, urgency, topic));
        return Task.FromResult(ResultsByEndpoint.GetValueOrDefault(subscription.Endpoint, PushDeliveryResult.Delivered));
    }
}

internal sealed class RecordingPushQueue : IPushQueue
{
    public List<PushJob> Jobs { get; } = [];
    public void Enqueue(PushJob job) => Jobs.Add(job);
}
