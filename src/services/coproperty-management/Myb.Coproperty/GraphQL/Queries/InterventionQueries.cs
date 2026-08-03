using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;
using System.Security.Claims;

namespace Myb.Coproperty.GraphQL.Queries;

[ExtendObjectType("Query")]
public class InterventionQueries
{
    public async Task<IEnumerable<Intervention>> GetInterventions(
        ClaimsPrincipal? user,
        [Service] IInterventionService interventionService,
        [Service] ICopropertyService copropertyService)
    {
        var interventions = await interventionService.GetAllAsync();
        var scopedIds = await CopropertyAccessControl.GetScopedCopropertyIdsAsync(user, copropertyService);
        if (scopedIds == null)
            return interventions;

        return interventions.Where(intervention => scopedIds.Contains(intervention.CopropertyId)).ToList();
    }

    public async Task<IEnumerable<Intervention>> GetInterventionsByCoproperty(
        Guid copropertyId,
        ClaimsPrincipal? user,
        [Service] IInterventionService interventionService,
        [Service] ICopropertyService copropertyService)
    {
        await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, copropertyId, copropertyService);
        return await interventionService.GetByCopropertyIdAsync(copropertyId);
    }

    public async Task<Intervention> GetInterventionById(
        Guid id,
        ClaimsPrincipal? user,
        [Service] IInterventionService interventionService,
        [Service] ICopropertyService copropertyService)
    {
        var intervention = await interventionService.GetByIdAsync(id);
        await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, intervention.CopropertyId, copropertyService);
        return intervention;
    }

    public async Task<IEnumerable<Intervention>> GetInterventionsByStatus(
        Guid copropertyId,
        InterventionStatus status,
        ClaimsPrincipal? user,
        [Service] IInterventionService interventionService,
        [Service] ICopropertyService copropertyService)
    {
        await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, copropertyId, copropertyService);
        return await interventionService.GetByStatusAsync(copropertyId, status);
    }
}
