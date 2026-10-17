using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Myb.Common.Messaging;
using Myb.Common.Authentification.Security;
using Myb.Common.Repositories;
using Myb.Notification.Hubs;
using Myb.Notification.Providers;
using Myb.Notification.Security;
using Myb.Notification.Services;

namespace Myb.Notification.Configuration;

public static class Configuration
{
    public static void ConfigureNotificationModule(this WebApplicationBuilder builder)
    {
        var notificationConnection = builder.Configuration.GetConnectionString("NotificationDBConnection");
        var useInMemoryStore = string.IsNullOrWhiteSpace(notificationConnection) ||
            notificationConnection.Contains("REPLACE_WITH", StringComparison.OrdinalIgnoreCase);

        builder.Services.AddPooledDbContextFactory<NotificationContext>(opts =>
        {
            if (useInMemoryStore)
                opts.UseInMemoryDatabase("myb-notifications");
            else
                opts.UseNpgsql(notificationConnection);
        });

        if (useInMemoryStore)
            Console.Error.WriteLine(
                "[Notification] No configured PostgreSQL database; using the in-memory staging store.");

        builder.AddMybApiSecurity();

        // JWT Bearer authentication for Keycloak
        var keycloakSection = builder.Configuration.GetSection("Keycloak");
        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Authority = keycloakSection["Authority"];
                options.Audience = keycloakSection["ClientId"];
                options.RequireHttpsMetadata = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuers = new[]
                        {
                            keycloakSection["Authority"],
                            keycloakSection["PublicAuthority"],
                            "http://localhost:8080/realms/MYB"
                        }
                        .Where(issuer => !string.IsNullOrWhiteSpace(issuer))
                        .Select(issuer => issuer!.TrimEnd('/'))
                        .Distinct(StringComparer.OrdinalIgnoreCase),
                    ValidateAudience = false,
                    ValidateIssuerSigningKey = true,
                };
                // SignalR sends access token via query string for WebSocket connections
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) &&
                            path.StartsWithSegments("/notificationhub"))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });
        builder.Services.AddAuthorization(options =>
            options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build());

        builder.Services.AddSignalR();
        builder.Services.AddSingleton<IUserIdProvider, KeycloakUserIdProvider>();
        builder.Services.Configure<NotificationSecurityOptions>(
            builder.Configuration.GetSection(NotificationSecurityOptions.SectionName));

        // Web Push: free browser push services authenticated with this deployment's VAPID keys.
        builder.Services.Configure<PushOptions>(builder.Configuration.GetSection(PushOptions.SectionName));
        builder.Services.AddHttpClient(WebPushSender.HttpClientName, client => client.Timeout = TimeSpan.FromSeconds(15));

        // WhatsApp Business (Meta Cloud API)
        builder.Services.Configure<WhatsAppOptions>(builder.Configuration.GetSection(WhatsAppOptions.SectionName));
        builder.Services.AddHttpClient(WhatsAppSender.HttpClientName, client => client.Timeout = TimeSpan.FromSeconds(15));
        builder.Services.AddSingleton<IWhatsAppSender, WhatsAppSender>();
        builder.Services.AddSingleton<IPushSubscriptionStore, PushSubscriptionStore>();
        builder.Services.AddSingleton<IWebPushSender, WebPushSender>();
        builder.Services.AddSingleton<PushDispatcher>();
        builder.Services.AddSingleton<IPushQueue>(sp => sp.GetRequiredService<PushDispatcher>());
        builder.Services.AddHostedService(sp => sp.GetRequiredService<PushDispatcher>());

        builder.Services.AddScoped<INotificationService, NotificationService>();
        builder.Services.AddEmailPublisher();
        builder.Services.AddControllers();
        builder.Services.AddHealthChecks();
    }

    public static void ConfigureNotificationModuleApp(this WebApplication app)
    {
        // Auto-create/migrate database
        using (var scope = app.Services.CreateScope())
        {
            var factory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<NotificationContext>>();
            using var context = factory.CreateDbContext();
            context.Database.EnsureCreated();
            if (context.Database.IsRelational())
            {
                // This service historically used EnsureCreated, so deployed
                // databases may not have EF's migration-history table. Apply the
                // additive notification scope change idempotently during rollout.
                context.Database.ExecuteSqlRaw(
                    "ALTER TABLE \"Notifications\" ADD COLUMN IF NOT EXISTS \"CopropertyId\" text;");
                context.Database.ExecuteSqlRaw(
                    "CREATE INDEX IF NOT EXISTS \"IX_Notifications_ReceiverId_CopropertyId_CreatedAt\" " +
                    "ON \"Notifications\" (\"ReceiverId\", \"CopropertyId\", \"CreatedAt\");");
                context.Database.ExecuteSqlRaw(
                    "CREATE TABLE IF NOT EXISTS \"PushSubscriptions\" (" +
                    "\"Id\" text NOT NULL PRIMARY KEY, " +
                    "\"UserId\" text NOT NULL, " +
                    "\"Endpoint\" text NOT NULL, " +
                    "\"P256dh\" text NOT NULL, " +
                    "\"Auth\" text NOT NULL, " +
                    "\"UserAgent\" text NULL, " +
                    "\"CreatedAt\" timestamp with time zone NOT NULL, " +
                    "\"LastSuccessAt\" timestamp with time zone NULL, " +
                    "\"FailureCount\" integer NOT NULL DEFAULT 0);");
                context.Database.ExecuteSqlRaw(
                    "CREATE UNIQUE INDEX IF NOT EXISTS \"IX_PushSubscriptions_Endpoint\" " +
                    "ON \"PushSubscriptions\" (\"Endpoint\");");
                context.Database.ExecuteSqlRaw(
                    "CREATE INDEX IF NOT EXISTS \"IX_PushSubscriptions_UserId\" " +
                    "ON \"PushSubscriptions\" (\"UserId\");");
            }
        }

        var push = app.Services.GetRequiredService<IOptions<PushOptions>>().Value;
        if (!push.IsConfigured)
            app.Logger.LogWarning(
                "[Notification] Web Push disabled: set Push__VapidPublicKey and Push__VapidPrivateKey to enable it.");

        var whatsApp = app.Services.GetRequiredService<IOptions<WhatsAppOptions>>().Value;
        if (!whatsApp.IsConfigured)
            app.Logger.LogWarning(
                "[Notification] WhatsApp disabled: set WhatsApp__Enabled=true, WhatsApp__PhoneNumberId and WhatsApp__AccessToken to enable it.");

        app.UseMybApiSecurity();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapHealthChecks("/health").AllowAnonymous();
        app.MapControllers().RequireAuthorization();
        app.MapHub<NotificationHub>("/notificationhub")
            .RequireAuthorization();  // protects the hub with JWT auth
    }
}
