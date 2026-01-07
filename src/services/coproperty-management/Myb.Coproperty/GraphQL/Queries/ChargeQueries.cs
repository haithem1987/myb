using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Queries
{
    [ExtendObjectType("Query")]
    public class ChargeQueries
    {
        public async Task<IEnumerable<Charge>> GetCharges(Guid copropertyId, [Service] IChargeService chargeService) =>
            await chargeService.GetChargesByCopropertyIdAsync(copropertyId);

        public async Task<Charge> GetChargeById(Guid id, [Service] IChargeService chargeService) =>
            await chargeService.GetByIdAsync(id);

        public async Task<IEnumerable<Charge>> GetActiveCharges(Guid copropertyId, [Service] IChargeService chargeService) =>
            await chargeService.GetActiveChargesAsync(copropertyId);
    }
}
