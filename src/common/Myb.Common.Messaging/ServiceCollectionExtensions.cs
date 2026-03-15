using Microsoft.Extensions.DependencyInjection;

namespace Myb.Common.Messaging;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddEmailPublisher(this IServiceCollection services)
    {
        services.AddSingleton<IEmailPublisher, RabbitMqEmailPublisher>();
        return services;
    }
}
