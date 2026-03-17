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
    }
}
