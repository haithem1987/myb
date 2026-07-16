using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Mutations
{
    [ExtendObjectType("Mutation")]
    public class CopropertyMutations
    {
        public async Task<Models.Coproperty> CreateCoproperty(Models.Coproperty coproperty, [Service] ICopropertyService copropertyService) =>
            await copropertyService.CreateAsync(coproperty);

        public async Task<Models.Coproperty> UpdateCoproperty(Guid id, Models.Coproperty coproperty, [Service] ICopropertyService copropertyService)
        {
            coproperty.Id = id;
            coproperty.UpdatedAt = DateTime.UtcNow;
            await copropertyService.UpdateAsync(coproperty);
            return await copropertyService.GetByIdAsync(id);
        }

        public async Task<bool> DeleteCoproperty(Guid id, [Service] ICopropertyService copropertyService)
        {
            // Service will throw InvalidOperationException if coproperty has associated data
            // HotChocolate automatically converts exceptions to GraphQL errors
            await copropertyService.DeleteAsync(id);
            return true;
        }

        /// <summary>Assign a Keycloak client role to a user (uses backend service account).</summary>
        public async Task<bool> AssignUserClientRole(
            string userId,
            string roleName,
            [Service] IKeycloakAdminService keycloakAdminService) =>
            await keycloakAdminService.AssignClientRoleAsync(userId, roleName);

        /// <summary>Remove a Keycloak client role from a user (uses backend service account).</summary>
        public async Task<bool> UnassignUserClientRole(
            string userId,
            string roleName,
            [Service] IKeycloakAdminService keycloakAdminService) =>
            await keycloakAdminService.UnassignClientRoleAsync(userId, roleName);
    }
}
