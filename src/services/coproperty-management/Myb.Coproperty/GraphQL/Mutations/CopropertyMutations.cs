using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Mutations
{
    [ExtendObjectType("Mutation")]
    public class CopropertyMutations
    {
        public async Task<Models.Coproperty> CreateCoproperty(Models.Coproperty coproperty, [Service] ICopropertyService copropertyService) =>
            await copropertyService.CreateAsync(coproperty);

        public async Task<Models.Coproperty> UpdateCoproperty(Guid id, Models.Coproperty coproperty, [Service] ICopropertyService copropertyService)
        {
            coproperty.Id = id;
            coproperty.UpdatedAt = DateTime.UtcNow;
            await copropertyService.UpdateAsync(coproperty);
            return await copropertyService.GetByIdAsync(id);
        }

        public async Task<bool> DeleteCoproperty(Guid id, [Service] ICopropertyService copropertyService)
        {
            await copropertyService.DeleteAsync(id);
            return true;
        }
    }
}
