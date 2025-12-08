using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Myb.Common.Repositories;
using Myb.Notification.Hubs;
using Myb.Notification.Providers;
using Myb.Notification.Services;

namespace Myb.Notification.Configuration;

public static class Configuration
{
    public static void ConfigureNotificationModule(this WebApplicationBuilder builder)
    {
        builder.Services.AddPooledDbContextFactory<NotificationContext>(opts =>
            opts.UseNpgsql(builder.Configuration.GetConnectionString("NotificationDBConnection")));

        builder.Services.AddSignalR();
        builder.Services.AddSingleton<IUserIdProvider, KeycloakUserIdProvider>();
        builder.Services.AddScoped<INotificationService, NotificationService>();
        builder.Services.AddControllers();
    }

    public static void ConfigureNotificationModuleApp(this WebApplication app)
    {
        app.MapControllers();
        app.MapHub<NotificationHub>("/notificationhub")
            .RequireAuthorization();  // protects the hub with JWT auth
    }
}