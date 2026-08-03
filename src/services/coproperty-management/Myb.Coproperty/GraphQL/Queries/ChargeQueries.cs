using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;
using System.Security.Claims;

namespace Myb.Coproperty.GraphQL.Queries
{
    [ExtendObjectType("Query")]
    public class ChargeQueries
    {
        public async Task<IEnumerable<Charge>> GetAllCharges(
            ClaimsPrincipal? user,
            [Service] IChargeService chargeService,
            [Service] ICopropertyService copropertyService)
        {
            var charges = await chargeService.GetAllAsync();
            var scopedIds = await CopropertyAccessControl.GetScopedCopropertyIdsAsync(user, copropertyService);
            if (scopedIds == null)
                return charges;

            return charges.Where(charge => scopedIds.Contains(charge.CopropertyId)).ToList();
        }

        public async Task<IEnumerable<Charge>> GetCharges(
            Guid copropertyId,
            ClaimsPrincipal? user,
            [Service] IChargeService chargeService,
            [Service] ICopropertyService copropertyService)
        {
            await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, copropertyId, copropertyService);
            return await chargeService.GetChargesByCopropertyIdAsync(copropertyId);
        }

        public async Task<Charge> GetChargeById(
            Guid id,
            ClaimsPrincipal? user,
            [Service] IChargeService chargeService,
            [Service] ICopropertyService copropertyService)
        {
            var charge = await chargeService.GetByIdAsync(id);
            await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, charge.CopropertyId, copropertyService);
            return charge;
        }

        public async Task<IEnumerable<Charge>> GetActiveCharges(
            Guid copropertyId,
            ClaimsPrincipal? user,
            [Service] IChargeService chargeService,
            [Service] ICopropertyService copropertyService)
        {
            await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, copropertyId, copropertyService);
            return await chargeService.GetActiveChargesAsync(copropertyId);
        }

        /// <summary>
        /// Get all charge distributions for a specific owner (by owner ID).
        /// Returns distributions for all units owned by this owner, including charge and unit details.
        /// </summary>
        public async Task<IEnumerable<ChargeDistribution>> GetOwnerChargeDistributions(
            Guid ownerId,
            ClaimsPrincipal? user,
            [Service] IChargeService chargeService,
            [Service] ICopropertyService copropertyService)
        {
            var distributions = await chargeService.GetDistributionsByOwnerAsync(ownerId);
            var scopedIds = await CopropertyAccessControl.GetScopedCopropertyIdsAsync(user, copropertyService);
            if (scopedIds == null)
                return distributions;

            return distributions
                .Where(distribution => distribution.Charge != null && scopedIds.Contains(distribution.Charge.CopropertyId))
                .ToList();
        }

        /// <summary>
        /// Get all charge distributions for a coproperty (syndic view).
        /// Returns all distributions with payment status, unit, and owner details.
        /// </summary>
        public async Task<IEnumerable<ChargeDistribution>> GetCopropertyChargeDistributions(
            Guid copropertyId,
            ClaimsPrincipal? user,
            [Service] IChargeService chargeService,
            [Service] ICopropertyService copropertyService)
        {
            await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, copropertyId, copropertyService);
            return await chargeService.GetDistributionsByCopropertyAsync(copropertyId);
        }
    }
}
