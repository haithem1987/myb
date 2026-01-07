using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Mutations
{
    [ExtendObjectType("Mutation")]
    public class OwnerMutations
    {
        public async Task<Owner> AddOwner(Owner owner, [Service] IOwnerService ownerService) =>
            await ownerService.CreateAsync(owner);

        public async Task<bool> RemoveOwner(Guid id, [Service] IOwnerService ownerService)
        {
            await ownerService.DeleteAsync(id);
            return true;
        }
    }
}
