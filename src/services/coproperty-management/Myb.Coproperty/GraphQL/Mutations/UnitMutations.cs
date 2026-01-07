using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Mutations
{
    [ExtendObjectType("Mutation")]
    public class UnitMutations
    {
        public async Task<Unit> CreateUnit(Unit unit, [Service] IUnitService unitService) =>
            await unitService.CreateAsync(unit);

        public async Task<bool> DeleteUnit(Guid id, [Service] IUnitService unitService)
        {
            await unitService.DeleteAsync(id);
            return true;
        }
    }
}
