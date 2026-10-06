using HotChocolate;
using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;
using System.Security.Claims;

namespace Myb.Coproperty.GraphQL.Queries
{
    [ExtendObjectType("Query")]
    public class SignalementQueries
    {
        public async Task<IEnumerable<Signalement>> GetSignalements(
            Guid copropertyId,
            ClaimsPrincipal? user,
            [Service] ISignalementService signalementService,
            [Service] ICopropertyService copropertyService,
            [Service] IDbContextFactory<CopropertyDbContext> contextFactory)
        {
            await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, copropertyId, copropertyService);
            var signalements = (await signalementService.GetByCopropertyIdAsync(copropertyId)).ToList();
            await EnrichReporterDetailsAsync(signalements, contextFactory);
            return signalements;
        }

        public async Task<IEnumerable<Signalement>> GetSignalementsByStatus(
            Guid copropertyId,
            SignalementStatus status,
            ClaimsPrincipal? user,
            [Service] ISignalementService signalementService,
            [Service] ICopropertyService copropertyService)
        {
            await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, copropertyId, copropertyService);
            return await signalementService.GetByStatusAsync(copropertyId, status);
        }

        /// <summary>
        /// Returns reports relevant to the current syndic. In addition to reports
        /// already tagged with a managed coproperty, this includes legacy reports
        /// submitted by owners who are actively assigned to one of that syndic's
        /// coproperties. Older clients used the first global coproperty when creating
        /// a report, so assignment-based matching keeps those reports visible.
        /// </summary>
        public async Task<IEnumerable<Signalement>> GetSyndicSignalements(
            Guid? managerId,
            ClaimsPrincipal? user,
            [Service] ICopropertyService copropertyService,
            [Service] IDbContextFactory<CopropertyDbContext> contextFactory)
        {
            if (!CopropertyAccessControl.IsSyndicOnly(user) &&
                !CopropertyAccessControl.IsAdmin(user))
                throw new InvalidOperationException(
                    "Accès refusé : seuls les syndics et administrateurs peuvent consulter ces signalements.");

            var effectiveManagerId = CopropertyAccessControl.ResolveEffectiveManagerId(user, managerId);
            var managedIds = (await copropertyService.GetAllAsync(effectiveManagerId))
                .Select(coproperty => coproperty.Id)
                .ToHashSet();

            if (managedIds.Count == 0)
                return Array.Empty<Signalement>();

            await using var context = await contextFactory.CreateDbContextAsync();
            return await context.Signalements
                .AsNoTracking()
                .Where(signalement =>
                    managedIds.Contains(signalement.CopropertyId) ||
                    context.Owners.Any(owner =>
                        owner.UserId == signalement.ReportedBy &&
                        owner.OwnerUnits.Any(link =>
                            link.EndDate == null &&
                            managedIds.Contains(link.Unit.CopropertyId))))
                .OrderByDescending(signalement => signalement.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Signalement>> GetMySignalements(
            Guid userId,
            ClaimsPrincipal? user,
            [Service] ISignalementService signalementService,
            [Service] ICopropertyService copropertyService)
        {
            if (CopropertyAccessControl.IsOwner(user) &&
                CopropertyAccessControl.GetUserId(user) != userId)
                throw new InvalidOperationException(
                    "Accès refusé : vous ne pouvez consulter que vos propres signalements.");

            var signalements = await signalementService.GetByReporterAsync(userId);

            if (CopropertyAccessControl.IsSelfOwner(user, userId))
                return signalements;

            var scopedIds = await CopropertyAccessControl.GetScopedCopropertyIdsAsync(user, copropertyService);
            if (scopedIds == null)
                return signalements;

            return signalements.Where(signalement => scopedIds.Contains(signalement.CopropertyId)).ToList();
        }

        public async Task<Signalement?> GetSignalementById(
            Guid id,
            ClaimsPrincipal? user,
            [Service] ISignalementService signalementService,
            [Service] ICopropertyService copropertyService)
        {
            var signalement = await signalementService.GetByIdAsync(id);
            if (signalement != null)
                await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, signalement.CopropertyId, copropertyService);
            return signalement;
        }

        private static async Task EnrichReporterDetailsAsync(
            IReadOnlyCollection<Signalement> signalements,
            IDbContextFactory<CopropertyDbContext> contextFactory)
        {
            if (signalements.Count == 0)
                return;

            var reporterIds = signalements
                .Select(signalement => signalement.ReportedBy)
                .Distinct()
                .ToArray();

            await using var context = await contextFactory.CreateDbContextAsync();
            var ownersByUserId = await context.Owners
                .AsNoTracking()
                .Where(owner => !owner.IsDeleted && reporterIds.Contains(owner.UserId))
                .Include(owner => owner.OwnerUnits)
                    .ThenInclude(link => link.Unit)
                .ToDictionaryAsync(owner => owner.UserId);

            foreach (var signalement in signalements)
            {
                if (!ownersByUserId.TryGetValue(signalement.ReportedBy, out var owner))
                    continue;

                signalement.ReporterEmail = string.IsNullOrWhiteSpace(owner.Email) ? null : owner.Email;
                signalement.ReporterPhone = string.IsNullOrWhiteSpace(owner.Phone) ? null : owner.Phone;
                signalement.ReporterLots = owner.OwnerUnits
                    .Where(link =>
                        link.EndDate == null &&
                        !link.Unit.IsDeleted &&
                        link.Unit.CopropertyId == signalement.CopropertyId)
                    .Select(link => link.Unit.UnitNumber)
                    .Where(unitNumber => !string.IsNullOrWhiteSpace(unitNumber))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .OrderBy(unitNumber => unitNumber)
                    .ToArray();
            }
        }
    }
}
