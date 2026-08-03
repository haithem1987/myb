using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;
using System.Security.Claims;

namespace Myb.Coproperty.GraphQL.Queries;

[ExtendObjectType("Query")]
public class AssemblyQueries
{
    public async Task<IEnumerable<Assembly>> GetAssemblies(
        Guid copropertyId,
        ClaimsPrincipal? user,
        [Service] IAssemblyService assemblyService,
        [Service] ICopropertyService copropertyService)
    {
        await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, copropertyId, copropertyService);
        return await assemblyService.GetByCopropertyIdAsync(copropertyId);
    }

    public async Task<IEnumerable<Assembly>> GetUpcomingAssemblies(
        Guid copropertyId,
        ClaimsPrincipal? user,
        [Service] IAssemblyService assemblyService,
        [Service] ICopropertyService copropertyService)
    {
        await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, copropertyId, copropertyService);
        return await assemblyService.GetUpcomingAssembliesAsync(copropertyId);
    }

    public async Task<Assembly> GetAssemblyById(
        Guid id,
        ClaimsPrincipal? user,
        [Service] IAssemblyService assemblyService,
        [Service] ICopropertyService copropertyService)
    {
        var assembly = await assemblyService.GetByIdAsync(id);
        await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, assembly.CopropertyId, copropertyService);
        return assembly;
    }
}
