namespace Myb.Coproperty.Services
{
    public class KeycloakOptions
    {
        public const string SectionName = "Keycloak";

        /// <summary>Keycloak realm base URL e.g. http://keycloak:8080/realms/MYB</summary>
        public string Authority { get; set; } = "";

        /// <summary>Frontend OIDC client (public). Used for user authentication.</summary>
        public string ClientId { get; set; } = "";
        public string ClientSecret { get; set; } = "";

        /// <summary>
        /// Confidential backend service account client for Keycloak Admin API calls.
        /// Falls back to ClientId/ClientSecret if not set.
        /// </summary>
        public string ServiceClientId { get; set; } = "";
        public string ServiceClientSecret { get; set; } = "";

        /// <summary>Realm role name whose members are shown as manager candidates. Default: coproperty-syndic</summary>
        public string ManagerRole { get; set; } = "coproperty-syndic";

        /// <summary>URL of the owner portal (used in welcome emails). E.g. https://myb-platform.com/coproperty/owner/dashboard</summary>
        public string OwnerPortalUrl { get; set; } = "https://myb-platform.com/coproperty/owner/dashboard";

        /// <summary>
        /// Optional: hardcoded UUID of the frontend OIDC client (MYB-client) in the Keycloak realm.
        /// When set, skips the /admin/realms/{realm}/clients?clientId= lookup (avoids needing view-clients permission).
        /// </summary>
        public string ClientUuid { get; set; } = "";

        // Resolved helpers
        public string EffectiveServiceClientId => !string.IsNullOrEmpty(ServiceClientId) ? ServiceClientId : ClientId;
        public string EffectiveServiceClientSecret => !string.IsNullOrEmpty(ServiceClientSecret) ? ServiceClientSecret : ClientSecret;
    }
}
