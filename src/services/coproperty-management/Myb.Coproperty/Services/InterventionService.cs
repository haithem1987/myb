using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.Services;

public class InterventionService : IInterventionService
{
    private readonly IInterventionRepository _interventionRepository;
    private readonly ICopropertyRepository _copropertyRepository;

    public InterventionService(
        IInterventionRepository interventionRepository,
        ICopropertyRepository copropertyRepository)
    {
        _interventionRepository = interventionRepository;
        _copropertyRepository = copropertyRepository;
    }

    public async Task<IEnumerable<Intervention>> GetAllAsync()
    {
        return await Task.FromResult(_interventionRepository.GetAll().ToList());
    }

    public async Task<IEnumerable<Intervention>> GetByCopropertyIdAsync(Guid copropertyId)
    {
        return await _interventionRepository.GetByCopropertyIdAsync(copropertyId);
    }

    public async Task<IEnumerable<Intervention>> GetByStatusAsync(Guid copropertyId, InterventionStatus status)
    {
        return await _interventionRepository.GetByStatusAsync(copropertyId, status);
    }

    public async Task<Intervention> GetByIdAsync(Guid id)
    {
        return await Task.FromResult(_interventionRepository.GetById(id)!);
    }

    public async Task<Intervention> CreateAsync(Intervention intervention)
    {
        if (intervention == null)
            throw new ArgumentNullException(nameof(intervention), "Intervention cannot be null");
        EnsureCopropertyIsActive(intervention.CopropertyId);

        intervention.CreatedAt = null;
        intervention.UpdatedAt = null;

        var result = await _interventionRepository.InsertAsync(intervention);

        if (result.Errors != null && result.Errors.Any())
        {
            var errorMessage = string.Join(", ", result.Errors);
            throw new InvalidOperationException($"Failed to create intervention: {errorMessage}");
        }

        if (result.Entity == null)
        {
            throw new InvalidOperationException("Failed to create intervention: Entity was not returned");
        }

        return result.Entity;
    }

    public async Task UpdateAsync(Intervention intervention)
    {
        EnsureCopropertyIsActive(intervention.CopropertyId);
        intervention.UpdatedAt = DateTime.UtcNow;
        await _interventionRepository.UpdateAsync(intervention);
    }

    public async Task DeleteAsync(Guid id)
    {
        var intervention = _interventionRepository.GetById(id)
            ?? throw new InvalidOperationException($"Intervention with ID {id} not found");
        EnsureCopropertyIsActive(intervention.CopropertyId);
        await _interventionRepository.DeleteAsync(id);
    }

    private void EnsureCopropertyIsActive(Guid copropertyId)
    {
        var coproperty = _copropertyRepository.GetById(copropertyId);
        if (coproperty == null || !coproperty.IsActive)
            throw new InvalidOperationException("New operations are not allowed for an inactive coproperty.");
    }
}
