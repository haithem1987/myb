using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;
using Myb.Coproperty.GraphQL.Types;
using AssemblyStatusModel = Myb.Coproperty.Models.AssemblyStatus;

namespace Myb.Coproperty.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class AssemblyMutations
{
    public async Task<Assembly> CreateAssembly(
        CreateAssemblyInput input,
        [Service] IAssemblyService assemblyService)
    {
        var assembly = input.ToEntity();
        return await assemblyService.CreateAsync(assembly);
    }

    public async Task<Assembly> UpdateAssembly(
        Guid id,
        UpdateAssemblyInput input,
        [Service] IAssemblyService assemblyService)
    {
        var assembly = await assemblyService.GetByIdAsync(id);
        if (assembly == null)
            throw new InvalidOperationException($"Assembly with ID {id} not found");

        if (input.Title != null) assembly.Title = input.Title;
        if (input.MeetingDate.HasValue) assembly.MeetingDate = input.MeetingDate.Value;
        if (input.Location != null) assembly.Location = input.Location;
        if (input.Agenda != null) assembly.Agenda = input.Agenda;
        if (input.Minutes != null) assembly.Minutes = input.Minutes;
        if (input.AssemblyType.HasValue) assembly.AssemblyType = input.AssemblyType.Value;
        if (input.Status.HasValue) assembly.Status = input.Status.Value;
        
        assembly.UpdatedAt = DateTime.UtcNow;
        await assemblyService.UpdateAsync(assembly);
        return assembly;
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
        AssemblyStatusModel status,
        [Service] IAssemblyService assemblyService)
    {
        var assembly = await assemblyService.GetByIdAsync(id);
        if (assembly == null)
            throw new InvalidOperationException($"Assembly with ID {id} not found");

        assembly.Status = status;
        assembly.UpdatedAt = DateTime.UtcNow;
        await assemblyService.UpdateAsync(assembly);
        return assembly;
    }
}
