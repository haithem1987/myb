using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Myb.Common.Messaging.Models;
using RabbitMQ.Client;

namespace Myb.Common.Messaging;

public class RabbitMqEmailPublisher : IEmailPublisher, IAsyncDisposable
{
    private readonly ILogger<RabbitMqEmailPublisher> _logger;
    private readonly IConnection _connection;
    private readonly IChannel _channel;
    private const string QueueName = "email-queue";

    public RabbitMqEmailPublisher(IConfiguration config, ILogger<RabbitMqEmailPublisher> logger)
    {
        _logger = logger;

        var factory = new ConnectionFactory
        {
            HostName = config["RabbitMq:Host"] ?? "rabbitmq",
            Port = int.Parse(config["RabbitMq:Port"] ?? "5672"),
            UserName = config["RabbitMq:Username"] ?? "guest",
            Password = config["RabbitMq:Password"] ?? "guest"
        };

        _connection = factory.CreateConnectionAsync().GetAwaiter().GetResult();
        _channel = _connection.CreateChannelAsync().GetAwaiter().GetResult();
        _channel.QueueDeclareAsync(QueueName, durable: true, exclusive: false, autoDelete: false)
            .GetAwaiter().GetResult();
    }

    public async Task PublishAsync(EmailMessage message)
    {
        var json = JsonSerializer.Serialize(message);
        var body = Encoding.UTF8.GetBytes(json);

        var props = new BasicProperties { Persistent = true };
        await _channel.BasicPublishAsync("", QueueName, mandatory: false, props, body);

        _logger.LogInformation("Email message published to queue for {To}", message.To);
    }

    public async ValueTask DisposeAsync()
    {
        await _channel.CloseAsync();
        await _connection.CloseAsync();
    }
}
