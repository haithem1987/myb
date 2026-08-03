using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;
using System.Security.Claims;

namespace Myb.Coproperty.GraphQL.Queries
{
    [ExtendObjectType("Query")]
    public class OwnerQueries
    {
        public async Task<IEnumerable<Owner>> GetOwners(
            Guid copropertyId,
            ClaimsPrincipal? user,
            [Service] IOwnerService ownerService,
            [Service] ICopropertyService copropertyService)
        {
            await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, copropertyId, copropertyService);
            return await ownerService.GetByCopropertyIdAsync(copropertyId);
        }

        public async Task<Owner> GetOwnerById(
            Guid id,
            ClaimsPrincipal? user,
            [Service] IOwnerService ownerService,
            [Service] ICopropertyService copropertyService)
        {
            var owner = await ownerService.GetByIdAsync(id);
            var scopedIds = await CopropertyAccessControl.GetScopedCopropertyIdsAsync(user, copropertyService);
            if (scopedIds == null)
                return owner;

            var hasAccess = owner.OwnerUnits
                .Any(link => link.EndDate == null && link.Unit != null && scopedIds.Contains(link.Unit.CopropertyId));
            if (!hasAccess)
                throw new InvalidOperationException("Accès refusé : ce copropriétaire n'est rattaché à aucune copropriété assignée.");

            return owner;
        }

        public async Task<Owner?> GetOwnerByUserId(
            Guid userId,
            ClaimsPrincipal? user,
            [Service] IOwnerService ownerService,
            [Service] ICopropertyService copropertyService)
        {
            var owner = await ownerService.GetByUserIdAsync(userId);
            if (owner == null)
                return null;

            var scopedIds = await CopropertyAccessControl.GetScopedCopropertyIdsAsync(user, copropertyService);
            if (scopedIds == null)
                return owner;

            var hasAccess = owner.OwnerUnits
                .Any(link => link.EndDate == null && link.Unit != null && scopedIds.Contains(link.Unit.CopropertyId));
            return hasAccess ? owner : null;
        }

        public async Task<IEnumerable<Owner>> GetOwnersByUnit(
            Guid unitId,
            ClaimsPrincipal? user,
            [Service] IOwnerService ownerService,
            [Service] IUnitService unitService,
            [Service] ICopropertyService copropertyService)
        {
            var unit = await unitService.GetByIdAsync(unitId);
            await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, unit.CopropertyId, copropertyService);
            return await ownerService.GetByUnitIdAsync(unitId);
        }
    }
}
