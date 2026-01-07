using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Queries
{
    [ExtendObjectType("Query")]
    public class UnitQueries
    {
        public async Task<IEnumerable<Unit>> GetUnits(Guid copropertyId, [Service] IUnitService unitService) =>
            await unitService.GetByCopropertyIdAsync(copropertyId);

        public async Task<Unit> GetUnitById(Guid id, [Service] IUnitService unitService) =>
            await unitService.GetByIdAsync(id);

        public async Task<IEnumerable<Unit>> GetUnitsByOwner(Guid ownerId, [Service] IUnitService unitService) =>
            await unitService.GetByOwnerIdAsync(ownerId);
    }
}
