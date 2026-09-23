using Myb.Common.Messaging;
using Myb.Common.Messaging.Models;
using System.Net;
using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;
using Myb.Coproperty.Models.Dtos;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Infrastructure.Data;

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

        /// <summary>Create a login account that can immediately be selected in Add Owner.</summary>
        public async Task<KeycloakUserSearchDto> CreateOwnerUserAccount(
            string firstName,
            string lastName,
            string email,
            string temporaryPassword,
            bool notifyOnActivation,
            string? language,
            ClaimsPrincipal? user,
            [Service] IKeycloakAdminService keycloakAdminService,
            [Service] IEmailPublisher emailPublisher,
            [Service] Microsoft.Extensions.Options.IOptions<KeycloakOptions> options,
            [Service] IDbContextFactory<CopropertyDbContext> contextFactory)
        {
            if (!CopropertyAccessControl.IsSyndicOnly(user) && !CopropertyAccessControl.IsAdmin(user))
                throw new InvalidOperationException("Accès refusé : seuls les syndics peuvent créer un compte propriétaire.");

            var creatorId = CopropertyAccessControl.GetUserId(user)?.ToString();
            var created = await keycloakAdminService.CreateUserAsync(
                firstName, lastName, email, temporaryPassword,
                notifyOnActivation ? creatorId : null);
            if (notifyOnActivation
                && Guid.TryParse(created.Id, out var createdUserId)
                && Guid.TryParse(creatorId, out var recipientUserId))
            {
                await using var context = await contextFactory.CreateDbContextAsync();
                context.AccountActivationNotifications.Add(new AccountActivationNotification
                {
                    Id = Guid.NewGuid(),
                    UserId = createdUserId,
                    RecipientUserId = recipientUserId
                });
                await context.SaveChangesAsync();
            }
            language = language?.StartsWith("en", StringComparison.OrdinalIgnoreCase) == true ? "en" : "fr";
            await keycloakAdminService.SetPreferredLanguageAsync(created.Id, language);
            var english = language == "en";
            var safeName = WebUtility.HtmlEncode(firstName);
            var safeEmail = WebUtility.HtmlEncode(created.Email);
            var safePassword = WebUtility.HtmlEncode(temporaryPassword);
            var url = WebUtility.HtmlEncode(options.Value.OwnerPortalUrl);
            await emailPublisher.PublishAsync(new EmailMessage
            {
                To = created.Email,
                Subject = english ? "Welcome to your MYB account" : "Bienvenue dans votre compte MYB",
                HtmlBody = english
                    ? $"<h2>Welcome to MYB, {safeName}!</h2><p>Your account is ready.</p><p>Email: <strong>{safeEmail}</strong><br>Temporary password: <strong>{safePassword}</strong></p><p><a href=\"{url}\">Access your account</a></p><p>At first login, verify your email and choose a new password.</p>"
                    : $"<h2>Bienvenue sur MYB, {safeName} !</h2><p>Votre compte est prêt.</p><p>E-mail : <strong>{safeEmail}</strong><br>Mot de passe temporaire : <strong>{safePassword}</strong></p><p><a href=\"{url}\">Accéder à votre compte</a></p><p>À la première connexion, vérifiez votre adresse e-mail et choisissez un nouveau mot de passe.</p>"
            });
            return created;
        }

        public async Task<bool> ConfirmCurrentUserActivation(
            ClaimsPrincipal? user,
            [Service] IKeycloakAdminService keycloakAdminService,
            [Service] IHttpClientFactory httpClientFactory,
            [Service] IEmailPublisher emailPublisher,
            [Service] IDbContextFactory<CopropertyDbContext> contextFactory)
        {
            var userId = CopropertyAccessControl.GetUserId(user)
                ?? throw new InvalidOperationException("Authentification requise.");
            if (!await keycloakAdminService.IsEmailVerifiedAsync(userId.ToString())) return false;

            await using var context = await contextFactory.CreateDbContextAsync();
            var activationRecords = await context.AccountActivationNotifications
                .Where(record => record.UserId == userId)
                .ToListAsync();
            if (activationRecords.Count > 0 && activationRecords.All(record => record.SentAt.HasValue))
                return false;

            // Recover accounts created before the durable mapping existed from the
            // legacy Keycloak attribute or an active unit assignment, then persist
            // the result so successful delivery remains idempotent.
            if (activationRecords.Count == 0)
            {
                var recipientIds = new HashSet<Guid>();
                var legacyRecipientId = await keycloakAdminService
                    .GetActivationNotificationRecipientAsync(userId.ToString());
                if (Guid.TryParse(legacyRecipientId, out var parsedRecipientId))
                    recipientIds.Add(parsedRecipientId);
                var relatedManagers = await context.Owners
                    .Where(owner => owner.UserId == userId)
                    .SelectMany(owner => owner.OwnerUnits)
                    .Where(link => link.EndDate == null)
                    .Select(link => link.Unit.Coproperty.ManagerId)
                    .Where(managerId => managerId.HasValue)
                    .Select(managerId => managerId!.Value)
                    .Distinct()
                    .ToListAsync();
                recipientIds.UnionWith(relatedManagers);
                if (recipientIds.Count == 0) return false;

                activationRecords = recipientIds.Select(recipientId => new AccountActivationNotification
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    RecipientUserId = recipientId
                }).ToList();
                context.AccountActivationNotifications.AddRange(activationRecords);
                await context.SaveChangesAsync();
            }

            var displayName = user?.FindFirst("name")?.Value
                ?? user?.FindFirst("preferred_username")?.Value
                ?? "Le nouvel utilisateur";
            foreach (var activationRecord in activationRecords.Where(record => !record.SentAt.HasValue))
            {
                var managerId = activationRecord.RecipientUserId.ToString();
                var recipient = await keycloakAdminService.GetUserByIdAsync(managerId)
                    ?? throw new InvalidOperationException("Activation notification recipient unavailable.");
                if (string.IsNullOrWhiteSpace(recipient.Email))
                    throw new InvalidOperationException("Activation notification recipient has no email.");
                var english = await keycloakAdminService.GetPreferredLanguageAsync(managerId) == "en";
                var message = english
                    ? $"{displayName} verified their email and accessed their MYB account."
                    : $"{displayName} a vérifié son adresse e-mail et accédé à son compte MYB.";
                await emailPublisher.PublishAsync(new EmailMessage
                {
                    To = recipient.Email,
                    Subject = english ? "MYB account activated" : "Compte MYB activé",
                    HtmlBody = $"<p>{WebUtility.HtmlEncode(message)}</p>"
                });
                var client = httpClientFactory.CreateClient("NotificationService");
                var response = await client.PostAsJsonAsync("/api/Notifications", new
                {
                    SenderId = userId.ToString(),
                    ReceiverId = managerId,
                    Message = message
                });
                response.EnsureSuccessStatusCode();
                activationRecord.SentAt = DateTime.UtcNow;
                await context.SaveChangesAsync();
            }
            return true;
        }

        public async Task<bool> SyncPreferredLanguage(
            string language,
            ClaimsPrincipal? user,
            [Service] IKeycloakAdminService keycloakAdminService)
        {
            var userId = CopropertyAccessControl.GetUserId(user)
                ?? throw new InvalidOperationException("Authentification requise.");
            return await keycloakAdminService.SetPreferredLanguageAsync(userId.ToString(), language);
        }

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
