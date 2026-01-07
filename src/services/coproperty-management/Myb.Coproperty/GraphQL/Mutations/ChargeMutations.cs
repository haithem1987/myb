using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Mutations
{
    [ExtendObjectType("Mutation")]
    public class ChargeMutations
    {
        public async Task<Charge> CreateCharge(Charge charge, [Service] IChargeService chargeService) =>
            await chargeService.CreateAsync(charge);

        public async Task<bool> DeleteCharge(Guid id, [Service] IChargeService chargeService)
        {
            await chargeService.DeleteAsync(id);
            return true;
        }

        public async Task<IEnumerable<ChargeDistribution>> DistributeCharge(Guid chargeId, [Service] IChargeService chargeService) =>
            await chargeService.DistributeChargeAsync(chargeId);
    }
}
