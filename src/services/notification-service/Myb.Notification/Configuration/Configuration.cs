using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Myb.Common.Messaging;
using Myb.Common.Authentification.Security;
using Myb.Common.Repositories;
using Myb.Notification.Hubs;
using Myb.Notification.Providers;
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
        }

        app.UseMybApiSecurity();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapHealthChecks("/health").AllowAnonymous();
        app.MapControllers().RequireAuthorization();
        app.MapHub<NotificationHub>("/notificationhub")
            .RequireAuthorization();  // protects the hub with JWT auth
    }
}
