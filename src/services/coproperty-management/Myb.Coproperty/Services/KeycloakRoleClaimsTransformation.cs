using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;

namespace Myb.Coproperty.Services
{
    /// <summary>
    /// Keycloak delivers realm roles under the "realm_access" claim and client roles
    /// under "resource_access.&lt;clientId&gt;.roles", both as raw JSON — the default
    /// ASP.NET Core JWT bearer handler does not map these to <see cref="ClaimTypes.Role"/>.
    /// This transformation flattens both into standard role claims so that role checks
    /// (e.g. <see cref="CopropertyAccessControl"/>) work against the authenticated principal.
    /// </summary>
    public class KeycloakRoleClaimsTransformation : IClaimsTransformation
    {
        private const string ClientId = "MYB-client";

        public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            if (principal.Identity is not ClaimsIdentity identity || !identity.IsAuthenticated)
                return Task.FromResult(principal);

            // Avoid duplicating role claims if this runs more than once for the same principal.
            if (identity.HasClaim(c => c.Type == ClaimTypes.Role))
                return Task.FromResult(principal);

            foreach (var roleName in ExtractRealmRoles(identity))
                identity.AddClaim(new Claim(ClaimTypes.Role, roleName));

            foreach (var roleName in ExtractClientRoles(identity, ClientId))
                identity.AddClaim(new Claim(ClaimTypes.Role, roleName));

            return Task.FromResult(principal);
        }

        private static IEnumerable<string> ExtractRealmRoles(ClaimsIdentity identity)
        {
            var raw = identity.FindFirst("realm_access")?.Value;
            if (string.IsNullOrWhiteSpace(raw))
                yield break;

            JsonDocument? doc = null;
            try
            {
                doc = JsonDocument.Parse(raw);
            }
            catch (JsonException)
            {
                yield break;
            }

            using (doc)
            {
                if (doc.RootElement.TryGetProperty("roles", out var roles) && roles.ValueKind == JsonValueKind.Array)
                {
                    foreach (var role in roles.EnumerateArray())
                    {
                        var value = role.GetString();
                        if (!string.IsNullOrEmpty(value))
                            yield return value;
                    }
                }
            }
        }

        private static IEnumerable<string> ExtractClientRoles(ClaimsIdentity identity, string clientId)
        {
            var raw = identity.FindFirst("resource_access")?.Value;
            if (string.IsNullOrWhiteSpace(raw))
                yield break;

            JsonDocument? doc = null;
            try
            {
                doc = JsonDocument.Parse(raw);
            }
            catch (JsonException)
            {
                yield break;
            }

            using (doc)
            {
                if (doc.RootElement.TryGetProperty(clientId, out var client) &&
                    client.TryGetProperty("roles", out var roles) &&
                    roles.ValueKind == JsonValueKind.Array)
                {
                    foreach (var role in roles.EnumerateArray())
                    {
                        var value = role.GetString();
                        if (!string.IsNullOrEmpty(value))
                            yield return value;
                    }
                }
            }
        }
    }
}
