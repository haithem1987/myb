using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace Myb.Payment;

/// <summary>
/// Development-only middleware: if the request carries the header
/// "X-Dev-Auth: bypass", it injects a fake authenticated user so that
/// Keycloak is not required for local testing.
///
/// NEVER active outside the Development environment (see Program.cs guard).
/// </summary>
public class DevAuthMiddleware(RequestDelegate next)
{
    private const string Header = "X-Dev-Auth";
    private const string Secret = "bypass";

    public async Task InvokeAsync(HttpContext ctx)
    {
        if (ctx.Request.Headers.TryGetValue(Header, out var val) &&
            val.ToString() == Secret)
        {
            var claims = new[]
            {
                new Claim("sub", "dev-test-user"),
                new Claim(ClaimTypes.NameIdentifier, "dev-test-user"),
                new Claim(ClaimTypes.Name, "Dev Tester"),
                new Claim(ClaimTypes.Role, "syndic"),
            };
            var identity = new ClaimsIdentity(claims, "DevAuth");
            ctx.User = new ClaimsPrincipal(identity);
        }

        await next(ctx);
    }
}
