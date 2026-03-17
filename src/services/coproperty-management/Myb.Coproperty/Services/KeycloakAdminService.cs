using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using Myb.Coproperty.Models.Dtos;

namespace Myb.Coproperty.Services
{
    /// <summary>
    /// Calls the Keycloak Admin REST API to retrieve users by realm role.
    /// Uses client_credentials to obtain an access token.
    /// </summary>
    public class KeycloakAdminService : IKeycloakAdminService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly KeycloakOptions _options;
        private readonly ILogger<KeycloakAdminService> _logger;

        // Token cache — scoped per DI scope (one per GraphQL request)
        private string? _cachedToken;
        private DateTimeOffset _tokenExpiry = DateTimeOffset.MinValue;

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public KeycloakAdminService(
            IHttpClientFactory httpClientFactory,
            IOptions<KeycloakOptions> options,
            ILogger<KeycloakAdminService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _options = options.Value;
            _logger = logger;
        }

        public async Task<IEnumerable<ManagerDto>> GetManagersByRoleAsync()
        {
            try
            {
                var (adminBaseUrl, realm) = ParseAuthority();
                var token = await GetAccessTokenAsync(adminBaseUrl, realm);
                await EnsureRoleExistsAsync(adminBaseUrl, realm, _options.ManagerRole, token);
                return await GetUsersForRoleAsync(adminBaseUrl, realm, _options.ManagerRole, token);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve managers from Keycloak");
                return Enumerable.Empty<ManagerDto>();
            }
        }

        // ── Helpers ──────────────────────────────────────────────────────────

        private (string adminBaseUrl, string realm) ParseAuthority()
        {
            var uri = new Uri(_options.Authority);
            var adminBase = $"{uri.Scheme}://{uri.Host}:{uri.Port}";
            // segments: ["/", "realms/", "MYB"]
            var realm = uri.Segments.LastOrDefault()?.TrimEnd('/') ?? "MYB";
            return (adminBase, realm);
        }

        private async Task<string> GetAccessTokenAsync(string adminBaseUrl, string realm)
        {
            if (_cachedToken is not null && DateTimeOffset.UtcNow < _tokenExpiry)
                return _cachedToken;

            var tokenUrl = $"{_options.Authority}/protocol/openid-connect/token";

            using var client = _httpClientFactory.CreateClient("keycloak-admin");
            using var form = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "client_credentials",
                ["client_id"] = _options.EffectiveServiceClientId,
                ["client_secret"] = _options.EffectiveServiceClientSecret
            });

            var response = await client.PostAsync(tokenUrl, form);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                throw new InvalidOperationException(
                    $"Keycloak token request failed ({response.StatusCode}): {body}");
            }

            var json = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
            _cachedToken = json.GetProperty("access_token").GetString()
                ?? throw new InvalidOperationException("access_token missing from Keycloak response");
            var expiresIn = json.GetProperty("expires_in").GetInt32();
            _tokenExpiry = DateTimeOffset.UtcNow.AddSeconds(expiresIn - 30);

            return _cachedToken;
        }

        private async Task EnsureRoleExistsAsync(
            string adminBaseUrl, string realm, string roleName, string token)
        {
            using var client = CreateAuthorizedClient(token);
            var checkUrl = $"{adminBaseUrl}/admin/realms/{realm}/roles/{roleName}";
            var checkResponse = await client.GetAsync(checkUrl);

            if (checkResponse.IsSuccessStatusCode) return;

            if (checkResponse.StatusCode == HttpStatusCode.NotFound)
            {
                _logger.LogInformation("Role '{Role}' not found in realm '{Realm}' — creating it", roleName, realm);

                var createUrl = $"{adminBaseUrl}/admin/realms/{realm}/roles";
                var payload = JsonContent.Create(new
                {
                    name = roleName,
                    description = "Coproperty manager / syndic role"
                });

                using var createClient = CreateAuthorizedClient(token);
                var createResponse = await createClient.PostAsync(createUrl, payload);

                if (createResponse.IsSuccessStatusCode)
                    _logger.LogInformation("Role '{Role}' created", roleName);
                else
                    _logger.LogWarning("Could not create role '{Role}': {Status}", roleName, createResponse.StatusCode);
            }
        }

        private async Task<IEnumerable<ManagerDto>> GetUsersForRoleAsync(
            string adminBaseUrl, string realm, string roleName, string token)
        {
            using var client = CreateAuthorizedClient(token);
            var url = $"{adminBaseUrl}/admin/realms/{realm}/roles/{roleName}/users";
            var response = await client.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Could not fetch users for role '{Role}': {Status}", roleName, response.StatusCode);
                return Enumerable.Empty<ManagerDto>();
            }

            var users = await response.Content.ReadFromJsonAsync<List<KeycloakUserDto>>(JsonOptions);
            return users?
                .Select(u => new ManagerDto(u.Id, u.FirstName ?? "", u.LastName ?? "", u.Email ?? ""))
                ?? Enumerable.Empty<ManagerDto>();
        }

        private HttpClient CreateAuthorizedClient(string bearerToken)
        {
            var client = _httpClientFactory.CreateClient("keycloak-admin");
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", bearerToken);
            return client;
        }

        // ── Keycloak user DTO (internal) ──────────────────────────────────────

        private sealed class KeycloakUserDto
        {
            public string Id { get; set; } = "";
            [JsonPropertyName("firstName")] public string? FirstName { get; set; }
            [JsonPropertyName("lastName")] public string? LastName { get; set; }
            [JsonPropertyName("email")] public string? Email { get; set; }
        }
    }
}
