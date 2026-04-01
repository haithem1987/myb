using Myb.Coproperty.Models.Dtos;

namespace Myb.Coproperty.Services
{
    public interface IKeycloakAdminService
    {
        /// <summary>
        /// Returns all Keycloak users that have the configured manager role (coproperty-syndic by default).
        /// Creates the role if it does not yet exist.
        /// </summary>
        Task<IEnumerable<ManagerDto>> GetManagersByRoleAsync();

        /// <summary>
        /// Search Keycloak users by partial email match using the service account.
        /// Returns up to <paramref name="max"/> users.
        /// </summary>
        Task<IEnumerable<KeycloakUserSearchDto>> SearchUsersByEmailAsync(string email, int max = 20);

        /// <summary>Get the client roles assigned to a Keycloak user.</summary>
        Task<IEnumerable<string>> GetUserClientRolesAsync(string userId);

        /// <summary>Assign a client role to a Keycloak user.</summary>
        Task<bool> AssignClientRoleAsync(string userId, string roleName);

        /// <summary>Remove a client role from a Keycloak user.</summary>
        Task<bool> UnassignClientRoleAsync(string userId, string roleName);
    }
}
