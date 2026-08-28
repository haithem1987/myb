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
            [Service] ICopropertyService copropertyService)
        {
            await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, copropertyId, copropertyService);
            return await signalementService.GetByCopropertyIdAsync(copropertyId);
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
    }
}
