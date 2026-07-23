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

        public async Task<IEnumerable<KeycloakUserSearchDto>> SearchUsersByEmailAsync(string email, int max = 20)
        {
            try
            {
                var (adminBaseUrl, realm) = ParseAuthority();
                var token = await GetAccessTokenAsync(adminBaseUrl, realm);

                using var client = CreateAuthorizedClient(token);
                var encodedEmail = Uri.EscapeDataString(email);
                // Use wildcard search so partial strings (e.g. "hait") match across
                // username, email, firstName and lastName (Keycloak 19+ wildcard support).
                var url = $"{adminBaseUrl}/admin/realms/{realm}/users?search=*{encodedEmail}*&max={max}";
                var response = await client.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Could not search users by email: {Status}", response.StatusCode);
                    return Enumerable.Empty<KeycloakUserSearchDto>();
                }

                var users = await response.Content.ReadFromJsonAsync<List<KeycloakUserDto>>(JsonOptions);
                if (users == null || users.Count == 0)
                    return Enumerable.Empty<KeycloakUserSearchDto>();

                // Get client UUID for role mappings
                var clientUuid = await GetClientUuidAsync(adminBaseUrl, realm, _options.ClientId, token);

                var results = new List<KeycloakUserSearchDto>();
                foreach (var user in users)
                {
                    var roles = new List<string>();
                    if (clientUuid != null)
                    {
                        try
                        {
                            using var roleClient = CreateAuthorizedClient(token);
                            var rolesUrl = $"{adminBaseUrl}/admin/realms/{realm}/users/{user.Id}/role-mappings/clients/{clientUuid}";
                            var rolesResponse = await roleClient.GetAsync(rolesUrl);
                            if (rolesResponse.IsSuccessStatusCode)
                            {
                                var userRoles = await rolesResponse.Content.ReadFromJsonAsync<List<KeycloakRoleDto>>(JsonOptions);
                                roles = userRoles?.Select(r => r.Name).Where(n => n != null).Select(n => n!).ToList() ?? new List<string>();
                            }
                        }
                        catch { /* ignore role fetch errors */ }
                    }

                    results.Add(new KeycloakUserSearchDto(
                        user.Id,
                        user.Email ?? "",
                        user.FirstName ?? "",
                        user.LastName ?? "",
                        user.Enabled,
                        user.EmailVerified,
                        roles));
                }

                return results;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to search Keycloak users by email '{Email}'", email);
                return Enumerable.Empty<KeycloakUserSearchDto>();
            }
        }

        public async Task<IEnumerable<string>> GetUserClientRolesAsync(string userId)
        {
            try
            {
                var (adminBaseUrl, realm) = ParseAuthority();
                var token = await GetAccessTokenAsync(adminBaseUrl, realm);
                var clientUuid = await GetClientUuidAsync(adminBaseUrl, realm, _options.ClientId, token);
                if (clientUuid == null) return Enumerable.Empty<string>();

                using var client = CreateAuthorizedClient(token);
                var url = $"{adminBaseUrl}/admin/realms/{realm}/users/{Uri.EscapeDataString(userId)}/role-mappings/clients/{clientUuid}";
                var response = await client.GetAsync(url);
                if (!response.IsSuccessStatusCode) return Enumerable.Empty<string>();

                var roles = await response.Content.ReadFromJsonAsync<List<KeycloakRoleDto>>(JsonOptions);
                return roles?.Select(r => r.Name).Where(n => n != null).Select(n => n!).ToList()
                       ?? Enumerable.Empty<string>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get client roles for user '{UserId}'", userId);
                return Enumerable.Empty<string>();
            }
        }

        public async Task<bool> AssignClientRoleAsync(string userId, string roleName)
        {
            try
            {
                var (adminBaseUrl, realm) = ParseAuthority();
                var token = await GetAccessTokenAsync(adminBaseUrl, realm);
                var clientUuid = await GetClientUuidAsync(adminBaseUrl, realm, _options.ClientId, token);
                if (clientUuid == null) return false;

                // Fetch the role definition
                using var getRoleClient = CreateAuthorizedClient(token);
                var roleUrl = $"{adminBaseUrl}/admin/realms/{realm}/clients/{clientUuid}/roles/{Uri.EscapeDataString(roleName)}";
                var roleResponse = await getRoleClient.GetAsync(roleUrl);

                string roleJson;
                if (!roleResponse.IsSuccessStatusCode)
                {
                    // Role doesn't exist yet — create it
                    _logger.LogInformation("Role '{Role}' not found on client, creating it...", roleName);
                    using var createRoleClient = CreateAuthorizedClient(token);
                    var createPayload = new StringContent(
                        System.Text.Json.JsonSerializer.Serialize(new { name = roleName }),
                        System.Text.Encoding.UTF8, "application/json");
                    var createResponse = await createRoleClient.PostAsync(
                        $"{adminBaseUrl}/admin/realms/{realm}/clients/{clientUuid}/roles", createPayload);

                    if (!createResponse.IsSuccessStatusCode)
                    {
                        var body = await createResponse.Content.ReadAsStringAsync();
                        _logger.LogWarning("Could not create role '{Role}': {Status} {Body}", roleName, createResponse.StatusCode, body);
                        return false;
                    }

                    // Re-fetch the newly created role
                    using var refetchClient = CreateAuthorizedClient(token);
                    var refetchResponse = await refetchClient.GetAsync(roleUrl);
                    if (!refetchResponse.IsSuccessStatusCode) return false;
                    roleJson = await refetchResponse.Content.ReadAsStringAsync();
                }
                else
                {
                    roleJson = await roleResponse.Content.ReadAsStringAsync();
                }

                // Assign it
                using var assignClient = CreateAuthorizedClient(token);
                var assignUrl = $"{adminBaseUrl}/admin/realms/{realm}/users/{Uri.EscapeDataString(userId)}/role-mappings/clients/{clientUuid}";
                var assignResponse = await assignClient.PostAsync(assignUrl,
                    new StringContent($"[{roleJson}]", System.Text.Encoding.UTF8, "application/json"));

                if (!assignResponse.IsSuccessStatusCode)
                {
                    // 409 Conflict means the role is already assigned — treat as success
                    if (assignResponse.StatusCode == HttpStatusCode.Conflict)
                    {
                        _logger.LogInformation("Role '{Role}' already assigned to user '{User}' — skipping", roleName, userId);
                        return true;
                    }
                    var body = await assignResponse.Content.ReadAsStringAsync();
                    _logger.LogWarning("Could not assign role '{Role}' to user '{User}': {Status} {Body}", roleName, userId, assignResponse.StatusCode, body);
                    return false;
                }
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to assign role '{Role}' to user '{UserId}'", roleName, userId);
                return false;
            }
        }

        public async Task<bool> UnassignClientRoleAsync(string userId, string roleName)
        {
            try
            {
                var (adminBaseUrl, realm) = ParseAuthority();
                var token = await GetAccessTokenAsync(adminBaseUrl, realm);
                var clientUuid = await GetClientUuidAsync(adminBaseUrl, realm, _options.ClientId, token);
                if (clientUuid == null) return false;

                // Fetch the role definition
                using var getRoleClient = CreateAuthorizedClient(token);
                var roleUrl = $"{adminBaseUrl}/admin/realms/{realm}/clients/{clientUuid}/roles/{Uri.EscapeDataString(roleName)}";
                var roleResponse = await getRoleClient.GetAsync(roleUrl);
                if (!roleResponse.IsSuccessStatusCode) return false;
                var roleJson = await roleResponse.Content.ReadAsStringAsync();

                // Remove it
                using var deleteClient = CreateAuthorizedClient(token);
                var deleteUrl = $"{adminBaseUrl}/admin/realms/{realm}/users/{Uri.EscapeDataString(userId)}/role-mappings/clients/{clientUuid}";
                var request = new HttpRequestMessage(HttpMethod.Delete, deleteUrl)
                {
                    Content = new StringContent($"[{roleJson}]", System.Text.Encoding.UTF8, "application/json")
                };
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
                var deleteResponse = await _httpClientFactory.CreateClient("keycloak-admin").SendAsync(request);

                if (!deleteResponse.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Could not unassign role '{Role}' from user '{User}': {Status}", roleName, userId, deleteResponse.StatusCode);
                    return false;
                }
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to unassign role '{Role}' from user '{UserId}'", roleName, userId);
                return false;
            }
        }

        public async Task ChangeOwnPasswordAsync(
            string userId,
            string username,
            string currentPassword,
            string newPassword)
        {
            if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(username))
                throw new UnauthorizedAccessException("Utilisateur authentifié introuvable.");
            if (string.IsNullOrWhiteSpace(currentPassword) || string.IsNullOrWhiteSpace(newPassword))
                throw new InvalidOperationException("Les mots de passe sont requis.");
            if (currentPassword == newPassword)
                throw new InvalidOperationException("Le nouveau mot de passe doit être différent du mot de passe actuel.");

            var (adminBaseUrl, realm) = ParseAuthority();
            await VerifyCurrentPasswordAsync(username, currentPassword);

            var adminToken = await GetAccessTokenAsync(adminBaseUrl, realm);
            using var client = CreateAuthorizedClient(adminToken);
            var url = $"{adminBaseUrl}/admin/realms/{realm}/users/{Uri.EscapeDataString(userId)}/reset-password";
            using var response = await client.PutAsJsonAsync(url, new
            {
                type = "password",
                value = newPassword,
                temporary = false
            });

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                _logger.LogWarning(
                    "Keycloak rejected password update for user '{UserId}': {Status} {Body}",
                    userId,
                    response.StatusCode,
                    body);
                throw new InvalidOperationException(
                    "Le mot de passe n'a pas pu être modifié. Vérifiez la politique de mot de passe.");
            }
        }

        // ── Helpers ──────────────────────────────────────────────────────────

        private (string adminBaseUrl, string realm) ParseAuthority()
        {
            var uri = new Uri(_options.Authority);
            var hostBase = $"{uri.Scheme}://{uri.Host}:{uri.Port}";
            // Extract any path prefix before /realms/ (e.g. "/auth" when KC_HTTP_RELATIVE_PATH=/auth)
            var path = uri.AbsolutePath;
            var realmIdx = path.IndexOf("/realms/", StringComparison.OrdinalIgnoreCase);
            var basePath = realmIdx > 0 ? path.Substring(0, realmIdx) : string.Empty; // e.g. "/auth"
            var adminBaseUrl = hostBase + basePath;
            // segments: e.g. ["/", "auth/", "realms/", "MYB"]
            var realm = uri.Segments.LastOrDefault()?.TrimEnd('/') ?? "MYB";
            return (adminBaseUrl, realm);
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

        private async Task VerifyCurrentPasswordAsync(string username, string currentPassword)
        {
            using var client = _httpClientFactory.CreateClient("keycloak-admin");
            var values = new Dictionary<string, string>
            {
                ["grant_type"] = "password",
                ["client_id"] = _options.ClientId,
                ["username"] = username,
                ["password"] = currentPassword,
                ["scope"] = "openid"
            };
            if (!string.IsNullOrWhiteSpace(_options.ClientSecret))
                values["client_secret"] = _options.ClientSecret;

            using var response = await client.PostAsync(
                $"{_options.Authority}/protocol/openid-connect/token",
                new FormUrlEncodedContent(values));

            if (response.IsSuccessStatusCode)
                return;

            if (response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.Unauthorized)
                throw new UnauthorizedAccessException("Le mot de passe actuel est incorrect.");

            _logger.LogWarning("Could not verify current password: {Status}", response.StatusCode);
            throw new InvalidOperationException(
                "La vérification du mot de passe est indisponible. Vérifiez que Direct Access Grants est activé pour le client Keycloak.");
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

        public async Task<ManagerDto?> GetUserByIdAsync(string userId)
        {
            try
            {
                var (adminBaseUrl, realm) = ParseAuthority();
                var token = await GetAccessTokenAsync(adminBaseUrl, realm);

                using var client = CreateAuthorizedClient(token);
                var url = $"{adminBaseUrl}/admin/realms/{realm}/users/{Uri.EscapeDataString(userId)}";
                var response = await client.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("GetUserByIdAsync: GET {Url} returned {Status}", url, response.StatusCode);
                    return null;
                }

                var user = await response.Content.ReadFromJsonAsync<KeycloakUserDto>(JsonOptions);
                if (user == null) return null;

                return new ManagerDto(user.Id, user.FirstName ?? "", user.LastName ?? "", user.Email ?? "");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetUserByIdAsync failed for userId='{UserId}'", userId);
                return null;
            }
        }

        private async Task<IEnumerable<ManagerDto>> GetUsersForRoleAsync(
            string adminBaseUrl, string realm, string roleName, string token)
        {
            // Query for CLIENT role users (not realm role users)
            // since we assign coproperty-syndic as a client role on MYB-client
            var clientUuid = await GetClientUuidAsync(adminBaseUrl, realm, _options.ClientId, token);
            if (clientUuid == null)
            {
                _logger.LogWarning("Could not get client UUID for '{ClientId}' — cannot fetch users for role '{Role}'", _options.ClientId, roleName);
                return Enumerable.Empty<ManagerDto>();
            }

            using var client = CreateAuthorizedClient(token);
            var url = $"{adminBaseUrl}/admin/realms/{realm}/clients/{clientUuid}/roles/{Uri.EscapeDataString(roleName)}/users";
            var response = await client.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Could not fetch users for client role '{Role}': {Status}", roleName, response.StatusCode);
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

        private async Task<string?> GetClientUuidAsync(string adminBaseUrl, string realm, string clientId, string token)
        {
            // If the UUID is hardcoded in config, skip the admin API call entirely
            // (avoids needing view-clients permission on the service account)
            if (!string.IsNullOrWhiteSpace(_options.ClientUuid))
                return _options.ClientUuid;

            try
            {
                using var client = CreateAuthorizedClient(token);
                var url = $"{adminBaseUrl}/admin/realms/{realm}/clients?clientId={Uri.EscapeDataString(clientId)}";
                var response = await client.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("GetClientUuidAsync: GET {Url} returned {Status}", url, response.StatusCode);
                    return null;
                }

                var clients = await response.Content.ReadFromJsonAsync<List<JsonElement>>(JsonOptions);
                if (clients != null && clients.Count > 0)
                    return clients[0].GetProperty("id").GetString();

                _logger.LogWarning("GetClientUuidAsync: no client found with clientId='{ClientId}' (empty response — service account may lack view-clients permission)", clientId);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetClientUuidAsync failed for clientId='{ClientId}'", clientId);
                return null;
            }
        }

        // ── Keycloak user DTO (internal) ──────────────────────────────────────

        private sealed class KeycloakUserDto
        {
            public string Id { get; set; } = "";
            [JsonPropertyName("firstName")] public string? FirstName { get; set; }
            [JsonPropertyName("lastName")] public string? LastName { get; set; }
            [JsonPropertyName("email")] public string? Email { get; set; }
            [JsonPropertyName("enabled")] public bool Enabled { get; set; }
            [JsonPropertyName("emailVerified")] public bool EmailVerified { get; set; }
        }

        private sealed class KeycloakRoleDto
        {
            [JsonPropertyName("name")] public string? Name { get; set; }
        }
    }
}
