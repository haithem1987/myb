using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;
using Myb.Common.Messaging.Models;
using Myb.Mailer.Services;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace Myb.Mailer.Workers;

public class EmailConsumerWorker : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly IConfiguration _config;
    private readonly ILogger<EmailConsumerWorker> _logger;
    private IConnection? _connection;
    private IChannel? _channel;
    private const string QueueName = "email-queue";
    private const int MaxRetries = 5;
    private static readonly int[] RetryDelaysSeconds = [2, 5, 15, 30, 60];

    // Track retry counts by message body hash (cleared on success or discard)
    private readonly ConcurrentDictionary<string, int> _retryCounts = new();

    public EmailConsumerWorker(IServiceProvider services, IConfiguration config,
        ILogger<EmailConsumerWorker> logger)
    {
        _services = services;
        _config = config;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Email consumer worker starting...");

        var factory = new ConnectionFactory
        {
            HostName = _config["RabbitMq:Host"] ?? "rabbitmq",
            Port = int.Parse(_config["RabbitMq:Port"] ?? "5672"),
            UserName = _config["RabbitMq:Username"] ?? "guest",
            Password = _config["RabbitMq:Password"] ?? "guest"
        };

        // Retry connection with exponential backoff (max 5 attempts)
        var delays = new[] { 2, 5, 10, 20, 30 };
        for (int attempt = 0; attempt <= delays.Length; attempt++)
        {
            try
            {
                _connection = await factory.CreateConnectionAsync(stoppingToken);
                _logger.LogInformation("Connected to RabbitMQ on attempt {Attempt}", attempt + 1);
                break;
            }
            catch (Exception ex) when (attempt < delays.Length)
            {
                var wait = delays[attempt];
                _logger.LogWarning(ex, "RabbitMQ not reachable (attempt {Attempt}), retrying in {Wait}s...", attempt + 1, wait);
                await Task.Delay(TimeSpan.FromSeconds(wait), stoppingToken);
            }
        }

        if (_connection == null)
            throw new InvalidOperationException("Could not connect to RabbitMQ after multiple retries.");

        _channel = await _connection.CreateChannelAsync(cancellationToken: stoppingToken);
        await _channel.QueueDeclareAsync(QueueName, durable: true, exclusive: false,
            autoDelete: false, cancellationToken: stoppingToken);

        await _channel.BasicQosAsync(0, 1, false, stoppingToken);

        var consumer = new AsyncEventingBasicConsumer(_channel);
        consumer.ReceivedAsync += async (_, ea) =>
        {
            var json = Encoding.UTF8.GetString(ea.Body.ToArray());
            var messageKey = Convert.ToBase64String(
                System.Security.Cryptography.SHA256.HashData(ea.Body.Span)[..16]);

            try
            {
                var email = JsonSerializer.Deserialize<EmailMessage>(json);

                if (email != null)
                {
                    using var scope = _services.CreateScope();
                    var sender = scope.ServiceProvider.GetRequiredService<ISmtpEmailSender>();
                    await sender.SendAsync(email);
                }

                await _channel.BasicAckAsync(ea.DeliveryTag, false);
                _retryCounts.TryRemove(messageKey, out var _removed);
            }
            catch (Exception ex)
            {
                var retryCount = _retryCounts.AddOrUpdate(messageKey, 1, (_, count) => count + 1);

                if (retryCount > MaxRetries)
                {
                    _logger.LogError(ex,
                        "Email message failed after {MaxRetries} retries, discarding. Subject may be in: {Json}",
                        MaxRetries, json[..Math.Min(json.Length, 200)]);
                    await _channel.BasicAckAsync(ea.DeliveryTag, false); // discard
                    _retryCounts.TryRemove(messageKey, out var _discarded);
                }
                else
                {
                    var delaySec = RetryDelaysSeconds[Math.Min(retryCount - 1, RetryDelaysSeconds.Length - 1)];
                    _logger.LogWarning(ex,
                        "Failed to send email (attempt {Attempt}/{Max}), retrying in {Delay}s...",
                        retryCount, MaxRetries, delaySec);

                    // Wait before requeuing to avoid hammering the SMTP server
                    await Task.Delay(TimeSpan.FromSeconds(delaySec), stoppingToken);
                    await _channel.BasicNackAsync(ea.DeliveryTag, false, true);
                }
            }
        };

        await _channel.BasicConsumeAsync(QueueName, autoAck: false, consumer,
            cancellationToken: stoppingToken);

        _logger.LogInformation("Email consumer worker started, listening on queue '{Queue}'", QueueName);

        await Task.Delay(Timeout.Infinite, stoppingToken);
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Email consumer worker stopping...");
        if (_channel != null) await _channel.CloseAsync(cancellationToken);
        if (_connection != null) await _connection.CloseAsync(cancellationToken);
        await base.StopAsync(cancellationToken);
    }
}
