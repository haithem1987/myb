using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
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

        // Data Protection — keys must survive container restarts.
        // Mount a persistent volume at the path set by DataProtection__KeysPath
        // (e.g. /run/secrets/dp-keys). Falls back to ./dp-keys for local dev.
        var dpKeysPath = builder.Configuration["DataProtection:KeysPath"]
            ?? Path.Combine(AppContext.BaseDirectory, "dp-keys");
        builder.Services
            .AddDataProtection()
            .PersistKeysToFileSystem(new DirectoryInfo(dpKeysPath))
            .SetApplicationName("myb-notification");

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
        builder.Services.AddScoped<IWhatsAppConfigService, WhatsAppConfigService>();
        builder.Services.AddScoped<ICommunicationLogService, CommunicationLogService>();
        builder.Services.AddScoped<ICampaignService, CampaignService>();
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

                // Communication Hub tables
                context.Database.ExecuteSqlRaw("""
                    CREATE TABLE IF NOT EXISTS "CommunicationLogs" (
                        "Id" uuid NOT NULL PRIMARY KEY,
                        "SenderId" text NULL,
                        "SenderType" text NOT NULL DEFAULT 'system',
                        "RecipientId" text NOT NULL,
                        "RecipientEmail" text NULL,
                        "CopropertyId" text NULL,
                        "Channel" integer NOT NULL,
                        "Subject" text NOT NULL,
                        "Body" text NULL,
                        "TemplateId" text NULL,
                        "Status" integer NOT NULL DEFAULT 1,
                        "FailureReason" text NULL,
                        "EventType" text NULL,
                        "RelatedEntityId" uuid NULL,
                        "RelatedEntityType" text NULL,
                        "CampaignId" uuid NULL,
                        "SentAt" timestamp with time zone NOT NULL,
                        "DeliveredAt" timestamp with time zone NULL,
                        "ReadAt" timestamp with time zone NULL
                    );
                    """);
                context.Database.ExecuteSqlRaw(
                    "CREATE INDEX IF NOT EXISTS \"IX_CommunicationLogs_CopropertyId_SentAt\" " +
                    "ON \"CommunicationLogs\" (\"CopropertyId\", \"SentAt\" DESC);");
                context.Database.ExecuteSqlRaw(
                    "CREATE INDEX IF NOT EXISTS \"IX_CommunicationLogs_RecipientId_SentAt\" " +
                    "ON \"CommunicationLogs\" (\"RecipientId\", \"SentAt\" DESC);");
                context.Database.ExecuteSqlRaw(
                    "CREATE INDEX IF NOT EXISTS \"IX_CommunicationLogs_CampaignId\" " +
                    "ON \"CommunicationLogs\" (\"CampaignId\") WHERE \"CampaignId\" IS NOT NULL;");

                context.Database.ExecuteSqlRaw("""
                    CREATE TABLE IF NOT EXISTS "Campaigns" (
                        "Id" uuid NOT NULL PRIMARY KEY,
                        "Name" text NOT NULL,
                        "Description" text NULL,
                        "CopropertyId" text NULL,
                        "CreatedBy" text NOT NULL,
                        "Status" integer NOT NULL DEFAULT 0,
                        "ChannelsJson" text NOT NULL DEFAULT '[]',
                        "RecipientIdsJson" text NOT NULL DEFAULT '[]',
                        "Message" text NOT NULL,
                        "Subject" text NULL,
                        "ScheduledAt" timestamp with time zone NULL,
                        "StartedAt" timestamp with time zone NULL,
                        "CompletedAt" timestamp with time zone NULL,
                        "TotalRecipients" integer NOT NULL DEFAULT 0,
                        "SentCount" integer NOT NULL DEFAULT 0,
                        "FailedCount" integer NOT NULL DEFAULT 0,
                        "CreatedAt" timestamp with time zone NOT NULL
                    );
                    """);
                context.Database.ExecuteSqlRaw(
                    "CREATE INDEX IF NOT EXISTS \"IX_Campaigns_CopropertyId_CreatedAt\" " +
                    "ON \"Campaigns\" (\"CopropertyId\", \"CreatedAt\" DESC);");

                context.Database.ExecuteSqlRaw("""
                    CREATE TABLE IF NOT EXISTS "CopropertyWhatsAppConfigs" (
                        "CopropertyId" text NOT NULL PRIMARY KEY,
                        "PhoneNumberId" text NOT NULL,
                        "AccessToken" text NOT NULL,
                        "BusinessAccountId" text NOT NULL DEFAULT '',
                        "ApiVersion" text NOT NULL DEFAULT 'v19.0',
                        "Enabled" boolean NOT NULL DEFAULT true,
                        "UpdatedAt" timestamp with time zone NOT NULL
                    );
                    """);
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
