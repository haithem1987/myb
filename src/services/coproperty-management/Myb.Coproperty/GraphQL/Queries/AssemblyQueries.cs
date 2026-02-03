using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Queries;

[ExtendObjectType("Query")]
public class AssemblyQueries
{
    public async Task<IEnumerable<Assembly>> GetAssemblies(
        Guid copropertyId,
        [Service] IAssemblyService assemblyService) =>
        await assemblyService.GetByCopropertyIdAsync(copropertyId);

    public async Task<IEnumerable<Assembly>> GetUpcomingAssemblies(
        Guid copropertyId,
        [Service] IAssemblyService assemblyService) =>
        await assemblyService.GetUpcomingAssembliesAsync(copropertyId);

    public async Task<Assembly> GetAssemblyById(
        Guid id,
        [Service] IAssemblyService assemblyService) =>
        await assemblyService.GetByIdAsync(id);
}
