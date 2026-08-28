using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;
using System.Security.Claims;

namespace Myb.Coproperty.GraphQL.Queries
{
    [ExtendObjectType("Query")]
    public class UnitQueries
    {
        [GraphQLName("allUnitsBySyndic")]
        public async Task<IEnumerable<Unit>> GetAllUnitsBySyndic(
            ClaimsPrincipal? user,
            [Service] IUnitService unitService,
            Guid? managerId = null)
        {
            var effectiveManagerId = CopropertyAccessControl.ResolveEffectiveManagerId(user, managerId);

            // Administrators retain the global view. A syndic is always resolved
            // to their own authenticated user id by ResolveEffectiveManagerId.
            if (!effectiveManagerId.HasValue && CopropertyAccessControl.IsAdmin(user))
                return await unitService.GetAllAsync();

            if (!effectiveManagerId.HasValue)
                throw new InvalidOperationException("A manager is required to load syndic units.");

            return await unitService.GetByManagerIdAsync(effectiveManagerId.Value);
        }

        public async Task<IEnumerable<Unit>> GetUnits(
            Guid copropertyId,
            ClaimsPrincipal? user,
            [Service] IUnitService unitService,
            [Service] ICopropertyService copropertyService)
        {
            await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, copropertyId, copropertyService);
            return await unitService.GetByCopropertyIdAsync(copropertyId);
        }

        public async Task<Unit> GetUnitById(
            Guid id,
            ClaimsPrincipal? user,
            [Service] IUnitService unitService,
            [Service] ICopropertyService copropertyService)
        {
            var unit = await unitService.GetByIdAsync(id);
            await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, unit.CopropertyId, copropertyService);
            return unit;
        }

        public async Task<IEnumerable<Unit>> GetUnitsByOwner(
            Guid ownerId,
            ClaimsPrincipal? user,
            [Service] IUnitService unitService,
            [Service] ICopropertyService copropertyService)
        {
            var units = await unitService.GetByOwnerIdAsync(ownerId);

            if (CopropertyAccessControl.IsSelfOwner(user, ownerId))
                return units;

            var scopedIds = await CopropertyAccessControl.GetScopedCopropertyIdsAsync(user, copropertyService);
            if (scopedIds == null)
                return units;

            return units.Where(unit => scopedIds.Contains(unit.CopropertyId)).ToList();
        }
    }
}
