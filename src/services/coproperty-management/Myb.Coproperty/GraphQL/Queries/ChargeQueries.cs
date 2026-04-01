using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Queries
{
    [ExtendObjectType("Query")]
    public class ChargeQueries
    {
        public async Task<IEnumerable<Charge>> GetAllCharges([Service] IChargeService chargeService) =>
            await chargeService.GetAllAsync();

        public async Task<IEnumerable<Charge>> GetCharges(Guid copropertyId, [Service] IChargeService chargeService) =>
            await chargeService.GetChargesByCopropertyIdAsync(copropertyId);

        public async Task<Charge> GetChargeById(Guid id, [Service] IChargeService chargeService) =>
            await chargeService.GetByIdAsync(id);

        public async Task<IEnumerable<Charge>> GetActiveCharges(Guid copropertyId, [Service] IChargeService chargeService) =>
            await chargeService.GetActiveChargesAsync(copropertyId);

        /// <summary>
        /// Get all charge distributions for a specific owner (by owner ID).
        /// Returns distributions for all units owned by this owner, including charge and unit details.
        /// </summary>
        public async Task<IEnumerable<ChargeDistribution>> GetOwnerChargeDistributions(
            Guid ownerId,
            [Service] IChargeService chargeService) =>
            await chargeService.GetDistributionsByOwnerAsync(ownerId);

        /// <summary>
        /// Get all charge distributions for a coproperty (syndic view).
        /// Returns all distributions with payment status, unit, and owner details.
        /// </summary>
        public async Task<IEnumerable<ChargeDistribution>> GetCopropertyChargeDistributions(
            Guid copropertyId,
            [Service] IChargeService chargeService) =>
            await chargeService.GetDistributionsByCopropertyAsync(copropertyId);
    }
}
