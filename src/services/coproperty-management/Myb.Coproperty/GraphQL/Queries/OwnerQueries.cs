using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Queries
{
    [ExtendObjectType("Query")]
    public class OwnerQueries
    {
        public async Task<IEnumerable<Owner>> GetOwners(Guid copropertyId, [Service] IOwnerService ownerService) =>
            await ownerService.GetByCopropertyIdAsync(copropertyId);

        public async Task<Owner> GetOwnerById(Guid id, [Service] IOwnerService ownerService) =>
            await ownerService.GetByIdAsync(id);

        public async Task<IEnumerable<Owner>> GetOwnersByUnit(Guid unitId, [Service] IOwnerService ownerService) =>
            await ownerService.GetByUnitIdAsync(unitId);
    }
}
