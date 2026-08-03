using HotChocolate;
using HotChocolate.Types;
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

        public async Task<IEnumerable<Signalement>> GetMySignalements(
            Guid userId,
            ClaimsPrincipal? user,
            [Service] ISignalementService signalementService,
            [Service] ICopropertyService copropertyService)
        {
            var signalements = await signalementService.GetByReporterAsync(userId);
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
