using Myb.Coproperty.Models;

namespace Myb.Coproperty.Services
{
    public interface IMaintenanceService
    {
        Task<IEnumerable<MaintenanceRequest>> GetByCopropertyIdAsync(Guid copropertyId);
        Task<MaintenanceRequest> GetByIdAsync(Guid id);
        Task<MaintenanceRequest> CreateAsync(MaintenanceRequest request);
        Task UpdateAsync(MaintenanceRequest request);
        Task DeleteAsync(Guid id);
        Task<IEnumerable<MaintenanceRequest>> GetByRequesterAsync(Guid userId);
    }
}
