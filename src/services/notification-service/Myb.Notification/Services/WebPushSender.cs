using System.Net;
using Lib.Net.Http.WebPush;
using Lib.Net.Http.WebPush.Authentication;
using Microsoft.Extensions.Options;
using Myb.Notification.Configuration;
using Myb.Notification.Models;

namespace Myb.Notification.Services;

public enum PushDeliveryResult
{
    Delivered,
    /// <summary>The push service no longer knows this subscription (404/410): delete it.</summary>
    Gone,
    /// <summary>Temporary failure (429/5xx/network): retry later.</summary>
    Retry,
    /// <summary>Permanent failure for this message (other 4xx).</summary>
    Failed
}

public interface IWebPushSender
{
    Task<PushDeliveryResult> SendAsync(
        WebPushSubscription subscription, string payloadJson, PushUrgency urgency, string? topic,
        CancellationToken cancellationToken);
}

public class WebPushSender : IWebPushSender
{
    public const string HttpClientName = "webpush";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly PushOptions _options;
    private readonly ILogger<WebPushSender> _logger;
    private readonly Lazy<VapidAuthentication> _vapid;

    public WebPushSender(IHttpClientFactory httpClientFactory, IOptions<PushOptions> options, ILogger<WebPushSender> logger)
    {
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
        _logger = logger;
        _vapid = new Lazy<VapidAuthentication>(() =>
            new VapidAuthentication(_options.VapidPublicKey, _options.VapidPrivateKey) { Subject = _options.Subject });
    }

    public async Task<PushDeliveryResult> SendAsync(
        WebPushSubscription subscription, string payloadJson, PushUrgency urgency, string? topic,
        CancellationToken cancellationToken)
    {
        var target = new PushSubscription { Endpoint = subscription.Endpoint };
        target.SetKey(PushEncryptionKeyName.P256DH, subscription.P256dh);
        target.SetKey(PushEncryptionKeyName.Auth, subscription.Auth);

        var message = new PushMessage(payloadJson)
        {
            TimeToLive = _options.TimeToLiveSeconds,
            Urgency = urgency == PushUrgency.High ? PushMessageUrgency.High : PushMessageUrgency.Normal,
            Topic = topic
        };

        var client = new PushServiceClient(_httpClientFactory.CreateClient(HttpClientName))
        {
            DefaultAuthentication = _vapid.Value
        };

        try
        {
            await client.RequestPushMessageDeliveryAsync(target, message, cancellationToken);
            return PushDeliveryResult.Delivered;
        }
        catch (PushServiceClientException ex)
        {
            var status = (int)ex.StatusCode;
            if (ex.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Gone)
                return PushDeliveryResult.Gone;
            if (ex.StatusCode == HttpStatusCode.TooManyRequests || status >= 500)
                return PushDeliveryResult.Retry;
            _logger.LogWarning("Push service rejected message ({Status}): {Body}", status, ex.Body);
            return PushDeliveryResult.Failed;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning("Push service unreachable: {Message}", ex.Message);
            return PushDeliveryResult.Retry;
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return PushDeliveryResult.Retry;
        }
    }
}
