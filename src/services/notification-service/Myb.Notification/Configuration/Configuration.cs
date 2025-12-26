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

        // Register generic repository
        builder.Services.AddScoped(typeof(IGenericRepository<,,>), typeof(GenericRepository<,,>));

        // Configure JWT Authentication
        var keycloakAuthority = builder.Configuration["Keycloak:Authority"] ?? "http://keycloak:8080/realms/MYB";
        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Authority = keycloakAuthority;
                options.RequireHttpsMetadata = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true
                };
                // Allow SignalR to read token from query string
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/notificationhub"))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });

        builder.Services.AddAuthorization();

        // Add CORS policy for SignalR
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowNotificationOrigins", policy =>
            {
                policy.WithOrigins("http://localhost:4200", "http://localhost:4201", "http://localhost:8080")
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials()
                    .SetIsOriginAllowedToAllowWildcardSubdomains();
            });
        });

        builder.Services.AddSignalR();
        builder.Services.AddSingleton<IUserIdProvider, KeycloakUserIdProvider>();
        builder.Services.AddScoped<INotificationService, NotificationService>();
        builder.Services.AddControllers();
    }

    public static void ConfigureNotificationModuleApp(this WebApplication app)
    {
        app.UseCors("AllowNotificationOrigins");
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();
        app.MapHub<NotificationHub>("/notificationhub")
            .RequireCors("AllowNotificationOrigins");
    }
}