using System.Text.Json;
using System.Threading.Channels;
using Microsoft.Extensions.Options;
using Myb.Notification.Configuration;

namespace Myb.Notification.Services;

public enum PushUrgency
{
    Normal,
    High
}

public sealed record PushJob(
    string ReceiverId,
    string NotificationId,
    string Title,
    string Body,
    string Url,
    string? CopropertyId,
    PushUrgency Urgency,
    int Attempt = 0,
    IReadOnlyCollection<string>? RetrySubscriptionIds = null);

public interface IPushQueue
{
    /// <summary>Never blocks or throws: push delivery is best effort.</summary>
    void Enqueue(PushJob job);
}

/// <summary>
/// Sends Web Push messages in the background so a slow or unavailable push service can never
/// delay or fail the business call that produced the notification.
/// </summary>
public class PushDispatcher : BackgroundService, IPushQueue
{
    public const int MaxBodyLength = 180;
    internal static readonly TimeSpan[] RetryDelays =
        [TimeSpan.FromSeconds(2), TimeSpan.FromSeconds(10), TimeSpan.FromSeconds(60)];

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly Channel<PushJob> _channel =
        Channel.CreateBounded<PushJob>(new BoundedChannelOptions(10_000) { FullMode = BoundedChannelFullMode.DropOldest });

    private readonly IPushSubscriptionStore _store;
    private readonly IWebPushSender _sender;
    private readonly PushOptions _options;
    private readonly ILogger<PushDispatcher> _logger;

    public PushDispatcher(
        IPushSubscriptionStore store, IWebPushSender sender, IOptions<PushOptions> options,
        ILogger<PushDispatcher> logger)
    {
        _store = store;
        _sender = sender;
        _options = options.Value;
        _logger = logger;
    }

    public void Enqueue(PushJob job)
    {
        if (!_options.IsConfigured) return;
        _channel.Writer.TryWrite(job);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var job in _channel.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                var retry = await DeliverAsync(job, stoppingToken);
                if (retry != null) ScheduleRetry(retry, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Push delivery failed for notification {NotificationId}", job.NotificationId);
            }
        }
    }

    /// <summary>Delivers a job to every device of the receiver. Returns the job to retry for
    /// devices that failed temporarily, or null when nothing is left to do.</summary>
    internal async Task<PushJob?> DeliverAsync(PushJob job, CancellationToken cancellationToken)
    {
        var subscriptions = await _store.GetByUserAsync(job.ReceiverId);
        if (job.RetrySubscriptionIds != null)
            subscriptions = subscriptions.Where(s => job.RetrySubscriptionIds.Contains(s.Id)).ToList();
        if (subscriptions.Count == 0) return null;

        var payload = BuildPayload(job);
        var topic = BuildTopic(job.NotificationId);
        var toRetry = new List<string>();

        foreach (var subscription in subscriptions)
        {
            var result = await _sender.SendAsync(subscription, payload, job.Urgency, topic, cancellationToken);
            switch (result)
            {
                case PushDeliveryResult.Delivered:
                    await _store.MarkSuccessAsync(subscription.Id);
                    break;
                case PushDeliveryResult.Gone:
                    await _store.DeleteAsync(subscription.Id);
                    break;
                case PushDeliveryResult.Retry:
                    toRetry.Add(subscription.Id);
                    break;
                case PushDeliveryResult.Failed:
                    await _store.MarkFailureAsync(subscription.Id, _options.MaxConsecutiveFailures);
                    break;
            }
        }

        if (toRetry.Count == 0) return null;
        if (job.Attempt >= RetryDelays.Length)
        {
            foreach (var subscriptionId in toRetry)
                await _store.MarkFailureAsync(subscriptionId, _options.MaxConsecutiveFailures);
            return null;
        }
        // Only devices that failed temporarily are retried, so nobody gets a duplicate.
        return job with { Attempt = job.Attempt + 1, RetrySubscriptionIds = toRetry };
    }

    private void ScheduleRetry(PushJob job, CancellationToken stoppingToken)
    {
        var delay = RetryDelays[job.Attempt - 1];
        _ = Task.Run(async () =>
        {
            try
            {
                await Task.Delay(delay, stoppingToken);
                _channel.Writer.TryWrite(job);
            }
            catch (OperationCanceledException)
            {
                // Shutting down: undelivered retries are dropped.
            }
        }, CancellationToken.None);
    }

    internal static string BuildPayload(PushJob job)
    {
        var body = job.Body.Length > MaxBodyLength ? job.Body[..(MaxBodyLength - 1)] + "…" : job.Body;
        return JsonSerializer.Serialize(new
        {
            notificationId = job.NotificationId,
            title = job.Title,
            body,
            url = job.Url,
            copropertyId = job.CopropertyId,
            tag = job.NotificationId
        }, JsonOptions);
    }

    /// <summary>RFC 8030 topics are at most 32 URL-safe base64 characters.</summary>
    internal static string? BuildTopic(string notificationId)
    {
        var topic = new string(notificationId.Where(char.IsLetterOrDigit).ToArray());
        if (topic.Length == 0) return null;
        return topic.Length > 32 ? topic[..32] : topic;
    }
}
