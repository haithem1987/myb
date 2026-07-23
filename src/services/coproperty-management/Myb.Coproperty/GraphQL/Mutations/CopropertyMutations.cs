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

        /// <summary>
        /// Changes only the authenticated caller's password. The user id and username
        /// are derived from the validated bearer token and never accepted from the client.
        /// </summary>
        public async Task<bool> ChangeOwnPassword(
            string currentPassword,
            string newPassword,
            string confirmPassword,
            ClaimsPrincipal? user,
            [Service] IKeycloakAdminService keycloakAdminService)
        {
            if (!CopropertyAccessControl.IsAuthenticated(user))
                throw new UnauthorizedAccessException("Authentification requise.");
            if (newPassword != confirmPassword)
                throw new InvalidOperationException("Les mots de passe ne correspondent pas.");

            var userId = CopropertyAccessControl.GetUserId(user)?.ToString()
                ?? throw new UnauthorizedAccessException("Utilisateur authentifié introuvable.");
            var username = user!.FindFirst("preferred_username")?.Value
                ?? user.FindFirst(ClaimTypes.Name)?.Value
                ?? user.FindFirst(ClaimTypes.Email)?.Value
                ?? throw new UnauthorizedAccessException("Identifiant utilisateur introuvable.");

            try
            {
                await keycloakAdminService.ChangeOwnPasswordAsync(
                    userId,
                    username,
                    currentPassword,
                    newPassword);
                return true;
            }
            catch (UnauthorizedAccessException ex)
            {
                throw new GraphQLException(ErrorBuilder.New()
                    .SetMessage(ex.Message)
                    .SetCode("PASSWORD_VERIFICATION_FAILED")
                    .Build());
            }
            catch (InvalidOperationException ex)
            {
                throw new GraphQLException(ErrorBuilder.New()
                    .SetMessage(ex.Message)
                    .SetCode("PASSWORD_CHANGE_FAILED")
                    .Build());
            }
        }
    }
}
