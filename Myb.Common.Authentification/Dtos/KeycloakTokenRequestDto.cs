using System.Text.Json.Serialization;

namespace Myb.Common.Authentification.Dtos
{
    public class KeycloakTokenRequestDto
    {
        [JsonPropertyName("grant_type")]
        public string GrantType { get; set; }

        [JsonPropertyName("client_id")]
        public string ClientId { get; set; }

        [JsonPropertyName("username")]
        public string Username { get; set; }

        [JsonPropertyName("password")]
        public string Password { get; set; }

        [JsonPropertyName("client_secret")]
        public string ClientSecret { get; set; }

    }
}