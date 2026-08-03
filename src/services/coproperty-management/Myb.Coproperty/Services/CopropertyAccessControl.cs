using System.Security.Claims;

namespace Myb.Coproperty.Services
{
    /// <summary>
    /// Centralizes the server-side authorization rules for coproperty-manager (syndic)
    /// scoping. This is the enforcement point that ensures a syndic can only ever be
    /// scoped to their own coproperties, regardless of what a GraphQL caller supplies
    /// as input — client-supplied values are only ever honored for admin-level callers.
    /// </summary>
    public static class CopropertyAccessControl
    {
        public const string SyndicRole = "coproperty-syndic";
        public const string AdminRole = "coproperty-admin";
        public const string SystemAdminRole = "system-admin";

        public static bool IsAuthenticated(ClaimsPrincipal? user) =>
            user?.Identity?.IsAuthenticated == true;

        public static bool IsAdmin(ClaimsPrincipal? user)
        {
            if (!IsAuthenticated(user))
                return false;

            var roles = user!.FindAll(ClaimTypes.Role).Select(c => c.Value);
            return roles.Contains(AdminRole) || roles.Contains(SystemAdminRole);
        }

        /// <summary>
        /// True only for callers who hold the syndic role and no admin-level role —
        /// these are the callers that must be force-scoped to their own coproperties.
        /// </summary>
        public static bool IsSyndicOnly(ClaimsPrincipal? user)
        {
            if (!IsAuthenticated(user))
                return false;

            var roles = user!.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
            return roles.Contains(SyndicRole) && !IsAdmin(user);
        }

        public static Guid? GetUserId(ClaimsPrincipal? user)
        {
            var raw = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? user?.FindFirst("sub")?.Value
                ?? user?.FindFirst("nameid")?.Value;

            if (string.IsNullOrWhiteSpace(raw))
                return null;

            if (Guid.TryParse(raw, out var parsed))
                return parsed;

            return Guid.TryParseExact(raw, "N", out parsed) ? parsed : null;
        }

        /// <summary>
        /// Resolves the manager id that should actually be used to filter/scope a
        /// coproperty query, enforcing that authenticated syndics (non-admin) are
        /// always scoped to their own id. Requests coming from a syndic are always
        /// automatically filtered by their own userId; if the client explicitly
        /// supplied a *different* managerId, the request is rejected outright rather
        /// than silently overridden. Admins keep the requested filter (which may be
        /// null, meaning "no scoping / see everything").
        /// </summary>
        public static Guid? ResolveEffectiveManagerId(ClaimsPrincipal? user, Guid? requestedManagerId)
        {
            if (IsSyndicOnly(user))
            {
                var ownId = GetUserId(user)
                    ?? throw new InvalidOperationException("Impossible d'identifier l'utilisateur authentifié.");

                if (requestedManagerId.HasValue && requestedManagerId.Value != ownId)
                    throw new InvalidOperationException("Accès refusé : vous ne pouvez consulter que vos propres copropriétés.");

                return ownId;
            }

            return requestedManagerId;
        }

        /// <summary>
        /// Resolves the ManagerId that should be persisted on a Create/Update mutation,
        /// enforcing that authenticated syndics (non-admin) can only ever set their own
        /// id. The managerId is always automatically derived from the authenticated
        /// user; any client-supplied ManagerId that doesn't match the caller's own id
        /// is rejected rather than silently overridden. Admins keep the client-supplied
        /// value as-is (including null, to unassign).
        /// </summary>
        public static Guid? ResolveManagerIdForWrite(ClaimsPrincipal? user, Guid? requestedManagerId)
        {
            if (IsSyndicOnly(user))
            {
                var ownId = GetUserId(user)
                    ?? throw new InvalidOperationException("Impossible d'identifier l'utilisateur authentifié.");

                if (requestedManagerId.HasValue && requestedManagerId.Value != ownId)
                    throw new InvalidOperationException("Accès refusé : vous ne pouvez gérer que vos propres copropriétés.");

                return ownId;
            }

            return requestedManagerId;
        }

        /// <summary>
        /// Ensures a syndic-only caller owns the given coproperty (identified by its
        /// stored ManagerId) before allowing a read/update/delete of an already
        /// existing record looked up by id. Throws if the caller is a syndic and
        /// does not own the coproperty. Admins are always allowed through.
        /// </summary>
        public static void EnsureOwnership(ClaimsPrincipal? user, Guid? copropertyManagerId)
        {
            if (!IsSyndicOnly(user))
                return;

            var ownId = GetUserId(user)
                ?? throw new InvalidOperationException("Impossible d'identifier l'utilisateur authentifié.");

            if (copropertyManagerId != ownId)
                throw new InvalidOperationException("Accès refusé : cette copropriété ne vous est pas assignée.");
        }

        /// <summary>
        /// Validates that a syndic-only caller has access to the provided coproperty id.
        /// Admin-level callers bypass this check.
        /// </summary>
        public static async Task EnsureCopropertyOwnershipAsync(
            ClaimsPrincipal? user,
            Guid copropertyId,
            ICopropertyService copropertyService)
        {
            if (!IsSyndicOnly(user))
                return;

            var coproperty = await copropertyService.GetByIdAsync(copropertyId);
            EnsureOwnership(user, coproperty?.ManagerId);
        }

        /// <summary>
        /// For syndic-only callers, returns the exact set of coproperty ids they are
        /// allowed to access. Returns null for admin/non-syndic callers.
        /// </summary>
        public static async Task<HashSet<Guid>?> GetScopedCopropertyIdsAsync(
            ClaimsPrincipal? user,
            ICopropertyService copropertyService)
        {
            if (!IsSyndicOnly(user))
                return null;

            var managerId = GetUserId(user)
                ?? throw new InvalidOperationException("Impossible d'identifier l'utilisateur authentifié.");

            var coproperties = await copropertyService.GetAllAsync(managerId);
            return coproperties.Select(c => c.Id).ToHashSet();
        }
    }
}
