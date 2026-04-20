using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.Services;

public class InterventionService : IInterventionService
{
    private readonly IInterventionRepository _interventionRepository;

    public InterventionService(IInterventionRepository interventionRepository)
    {
        _interventionRepository = interventionRepository;
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
        intervention.UpdatedAt = DateTime.UtcNow;
        await _interventionRepository.UpdateAsync(intervention);
    }

    public async Task DeleteAsync(Guid id)
    {
        await _interventionRepository.DeleteAsync(id);
    }
}
