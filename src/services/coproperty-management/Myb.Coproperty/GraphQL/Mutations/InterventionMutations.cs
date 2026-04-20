using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.GraphQL.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class InterventionMutations
{
    public async Task<Intervention> CreateIntervention(
        CreateInterventionInput input,
        [Service] IInterventionService interventionService)
    {
        var intervention = input.ToIntervention();
        return await interventionService.CreateAsync(intervention);
    }

    public async Task<Intervention> UpdateIntervention(
        UpdateInterventionInput input,
        [Service] IInterventionService interventionService)
    {
        var intervention = input.ToIntervention();
        await interventionService.UpdateAsync(intervention);
        return await interventionService.GetByIdAsync(intervention.Id);
    }

    public async Task<bool> DeleteIntervention(
        Guid id,
        [Service] IInterventionService interventionService)
    {
        await interventionService.DeleteAsync(id);
        return true;
    }

    public async Task<Intervention> UpdateInterventionStatus(
        Guid id,
        InterventionStatus status,
        [Service] IInterventionService interventionService)
    {
        var intervention = await interventionService.GetByIdAsync(id);
        intervention.Status = status;
        intervention.UpdatedAt = DateTime.UtcNow;

        if (status == InterventionStatus.Completed)
            intervention.CompletedDate = DateTime.UtcNow;

        if (status == InterventionStatus.InProgress && intervention.StartedDate == null)
            intervention.StartedDate = DateTime.UtcNow;

        await interventionService.UpdateAsync(intervention);
        return await interventionService.GetByIdAsync(id);
    }

    public async Task<Intervention> AssignIntervention(
        Guid id,
        string providerName,
        string? providerPhone,
        string? providerEmail,
        [Service] IInterventionService interventionService)
    {
        var intervention = await interventionService.GetByIdAsync(id);
        intervention.ProviderName = providerName;
        intervention.ProviderPhone = providerPhone;
        intervention.ProviderEmail = providerEmail;
        intervention.Status = InterventionStatus.Planned;
        intervention.UpdatedAt = DateTime.UtcNow;

        await interventionService.UpdateAsync(intervention);
        return await interventionService.GetByIdAsync(id);
    }

    public async Task<Intervention> CompleteIntervention(
        Guid id,
        decimal? actualCost,
        string? resolution,
        [Service] IInterventionService interventionService)
    {
        var intervention = await interventionService.GetByIdAsync(id);
        intervention.Status = InterventionStatus.Completed;
        intervention.ActualCost = actualCost;
        intervention.Resolution = resolution;
        intervention.CompletedDate = DateTime.UtcNow;
        intervention.UpdatedAt = DateTime.UtcNow;

        await interventionService.UpdateAsync(intervention);
        return await interventionService.GetByIdAsync(id);
    }
}
