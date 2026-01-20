using System.Security.Claims;
using Myb.Coproperty.GraphQL.Mutations;

namespace Myb.Coproperty.Services;

/// <summary>
/// Service for handling authentication context
/// </summary>
public class AuthenticationService : IAuthenticationService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuthenticationService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string GetCurrentUserId()
    {
        var userId = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return userId ?? Guid.Empty.ToString();
    }
}
