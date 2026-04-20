using Myb.Coproperty.Models;

namespace Myb.Coproperty.Services;

public interface IInterventionService
{
    Task<IEnumerable<Intervention>> GetByCopropertyIdAsync(Guid copropertyId);
    Task<IEnumerable<Intervention>> GetByStatusAsync(Guid copropertyId, InterventionStatus status);
    Task<Intervention> GetByIdAsync(Guid id);
    Task<IEnumerable<Intervention>> GetAllAsync();
    Task<Intervention> CreateAsync(Intervention intervention);
    Task UpdateAsync(Intervention intervention);
    Task DeleteAsync(Guid id);
}
