using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Myb.Common.Authentification.Security;

public static class ApiSecurityExtensions
{
    public const string CorsPolicy = "MybCors";

    public static WebApplicationBuilder AddMybApiSecurity(this WebApplicationBuilder builder)
    {
        builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 15_000_000);

        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? (builder.Configuration["Cors:AllowedOrigins"] ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (origins.Length == 0)
        {
            origins = builder.Environment.IsDevelopment()
                ? ["http://localhost:4200", "http://localhost:4201"]
                : ["https://myb-platform.com", "https://www.myb-platform.com"];
        }

        builder.Services.AddCors(options => options.AddPolicy(CorsPolicy, policy =>
            policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

        var permitLimit = builder.Configuration.GetValue("Security:RateLimit:PermitLimit", 120);
        builder.Services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    context.User.Identity?.Name ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = permitLimit,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                        AutoReplenishment = true
                    }));
        });

        builder.Services.AddProblemDetails(options => options.CustomizeProblemDetails = context =>
        {
            context.ProblemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
        });

        return builder;
    }

    public static WebApplication UseMybApiSecurity(this WebApplication app)
    {
        if (!app.Environment.IsDevelopment())
        {
            app.UseExceptionHandler();
            app.UseHsts();
        }

        app.Use(async (context, next) =>
        {
            context.Response.OnStarting(() =>
            {
                var headers = context.Response.Headers;
                headers.TryAdd("X-Content-Type-Options", "nosniff");
                headers.TryAdd("X-Frame-Options", "DENY");
                headers.TryAdd("Referrer-Policy", "strict-origin-when-cross-origin");
                headers.TryAdd("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
                headers.TryAdd("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
                return Task.CompletedTask;
            });

            if (ShouldInspect(context.Request) && context.Request.ContentLength is > 15_000_000)
            {
                context.Response.StatusCode = StatusCodes.Status413PayloadTooLarge;
                await context.Response.WriteAsJsonAsync(new
                {
                    title = "Request body is too large",
                    status = StatusCodes.Status413PayloadTooLarge,
                    traceId = context.TraceIdentifier
                }, context.RequestAborted);
                return;
            }

            if (ShouldInspect(context.Request) && context.Request.ContentLength is > 0)
            {
                context.Request.EnableBuffering();
                using var reader = new StreamReader(context.Request.Body, leaveOpen: true);
                var body = await reader.ReadToEndAsync(context.RequestAborted);
                context.Request.Body.Position = 0;

                if (RequestThreatDetector.ContainsThreat(body))
                {
                    var logger = context.RequestServices.GetRequiredService<ILoggerFactory>()
                        .CreateLogger("Security.RequestThreatDetection");
                    logger.LogWarning("Blocked suspicious request on {Method} {Path}; trace {TraceId}",
                        context.Request.Method, context.Request.Path, context.TraceIdentifier);
                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    await context.Response.WriteAsJsonAsync(new
                    {
                        title = "Invalid request content",
                        status = StatusCodes.Status400BadRequest,
                        traceId = context.TraceIdentifier
                    }, context.RequestAborted);
                    return;
                }
            }

            await next();
        });

        app.UseRateLimiter();
        app.UseCors(CorsPolicy);
        return app;
    }

    private static bool ShouldInspect(HttpRequest request)
    {
        if (!(HttpMethods.IsPost(request.Method) || HttpMethods.IsPut(request.Method) ||
              HttpMethods.IsPatch(request.Method)))
            return false;

        var contentType = request.ContentType ?? string.Empty;
        return contentType.StartsWith("application/json", true, CultureInfo.InvariantCulture) ||
               contentType.StartsWith("application/graphql", true, CultureInfo.InvariantCulture) ||
               contentType.StartsWith("text/", true, CultureInfo.InvariantCulture) ||
               contentType.StartsWith("application/x-www-form-urlencoded", true, CultureInfo.InvariantCulture);
    }
}
