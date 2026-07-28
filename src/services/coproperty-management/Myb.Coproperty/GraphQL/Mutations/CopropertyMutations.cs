using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;
using System.Security.Claims;

namespace Myb.Coproperty.GraphQL.Mutations
{
    [ExtendObjectType("Mutation")]
    public class CopropertyMutations
    {
        public async Task<Models.Coproperty> CreateCoproperty(
            Models.Coproperty coproperty,
            ClaimsPrincipal? user,
            [Service] ICopropertyService copropertyService)
        {
            // Force-scope ManagerId to the authenticated syndic's own id; only
            // admin-level callers may set an arbitrary ManagerId on create.
            coproperty.ManagerId = CopropertyAccessControl.ResolveManagerIdForWrite(user, coproperty.ManagerId);
            return await copropertyService.CreateAsync(coproperty);
        }

        public async Task<Models.Coproperty> UpdateCoproperty(
            Guid id,
            Models.Coproperty coproperty,
            ClaimsPrincipal? user,
            [Service] ICopropertyService copropertyService)
        {
            // Verify the caller actually owns the record being updated before
            // touching anything — a syndic can never modify a coproperty that
            // isn't already assigned to them, regardless of the id supplied.
            var existing = await copropertyService.GetByIdAsync(id)
                ?? throw new InvalidOperationException("Copropriété introuvable.");
            CopropertyAccessControl.EnsureOwnership(user, existing.ManagerId);

            coproperty.Id = id;
            coproperty.UpdatedAt = DateTime.UtcNow;
            // Same enforcement as create: a syndic can never reassign a coproperty
            // to a different manager id, regardless of what the client supplies.
            coproperty.ManagerId = CopropertyAccessControl.ResolveManagerIdForWrite(user, coproperty.ManagerId);
            await copropertyService.UpdateAsync(coproperty);
            return await copropertyService.GetByIdAsync(id);
        }

        public async Task<bool> DeleteCoproperty(
            Guid id,
            ClaimsPrincipal? user,
            [Service] ICopropertyService copropertyService)
        {
            // A syndic may only delete coproperties assigned to them.
            var existing = await copropertyService.GetByIdAsync(id)
                ?? throw new InvalidOperationException("Copropriété introuvable.");
            CopropertyAccessControl.EnsureOwnership(user, existing.ManagerId);

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

        /// <summary>Change current authenticated user's password without leaving the app.</summary>
        public async Task<bool> ChangeOwnPassword(
            string currentPassword,
            string newPassword,
            string confirmPassword,
            ClaimsPrincipal? user,
            [Service] IHttpContextAccessor httpContextAccessor,
            [Service] IKeycloakAdminService keycloakAdminService)
        {
            var effectiveUser = user?.Identity?.IsAuthenticated == true
                ? user
                : httpContextAccessor.HttpContext?.User;

            if (effectiveUser?.Identity?.IsAuthenticated != true)
                throw new InvalidOperationException("Authentification requise.");

            var userId = effectiveUser.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? effectiveUser.FindFirst("sub")?.Value
                ?? effectiveUser.FindFirst("nameid")?.Value;

            if (string.IsNullOrWhiteSpace(userId))
                throw new InvalidOperationException("Impossible d'identifier l'utilisateur authentifié.");

            return await keycloakAdminService.ChangeOwnPasswordAsync(
                userId,
                currentPassword,
                newPassword,
                confirmPassword);
        }
    }
}
