using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class AssemblyMutations
{
    public async Task<Assembly> CreateAssembly(
        Assembly assembly,
        [Service] IAssemblyService assemblyService) =>
        await assemblyService.CreateAsync(assembly);

    public async Task<Assembly> UpdateAssembly(
        Guid id,
        Assembly assembly,
        [Service] IAssemblyService assemblyService)
    {
        assembly.Id = id;
        await assemblyService.UpdateAsync(assembly);
        return await assemblyService.GetByIdAsync(id);
    }

    public async Task<bool> DeleteAssembly(
        Guid id,
        [Service] IAssemblyService assemblyService)
    {
        await assemblyService.DeleteAsync(id);
        return true;
    }

    public async Task<Assembly> UpdateAssemblyStatus(
        Guid id,
        AssemblyStatus status,
        [Service] IAssemblyService assemblyService)
    {
        var assembly = await assemblyService.GetByIdAsync(id);
        if (assembly == null)
            throw new InvalidOperationException($"Assembly with ID {id} not found");

        assembly.Status = status;
        await assemblyService.UpdateAsync(assembly);
        return assembly;
    }
}
