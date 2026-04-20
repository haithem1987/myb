using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Queries;

[ExtendObjectType("Query")]
public class InterventionQueries
{
    public async Task<IEnumerable<Intervention>> GetInterventions(
        [Service] IInterventionService interventionService) =>
        await interventionService.GetAllAsync();

    public async Task<IEnumerable<Intervention>> GetInterventionsByCoproperty(
        Guid copropertyId,
        [Service] IInterventionService interventionService) =>
        await interventionService.GetByCopropertyIdAsync(copropertyId);

    public async Task<Intervention> GetInterventionById(
        Guid id,
        [Service] IInterventionService interventionService) =>
        await interventionService.GetByIdAsync(id);

    public async Task<IEnumerable<Intervention>> GetInterventionsByStatus(
        Guid copropertyId,
        InterventionStatus status,
        [Service] IInterventionService interventionService) =>
        await interventionService.GetByStatusAsync(copropertyId, status);
}
