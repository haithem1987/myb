using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.Services
{
    public class MaintenanceService : IMaintenanceService
    {
        private readonly IMaintenanceRepository _maintenanceRepository;

        public MaintenanceService(IMaintenanceRepository maintenanceRepository)
        {
            _maintenanceRepository = maintenanceRepository;
        }

        public async Task<MaintenanceRequest> CreateAsync(MaintenanceRequest request)
        {
            var result = await _maintenanceRepository.InsertAsync(request);
            return result.Entity!;
        }

        public async Task DeleteAsync(Guid id)
        {
            await _maintenanceRepository.DeleteAsync(id);
        }

        public async Task<MaintenanceRequest> GetByIdAsync(Guid id)
        {
            return await Task.FromResult(_maintenanceRepository.GetById(id)!);
        }

        public async Task<IEnumerable<MaintenanceRequest>> GetByCopropertyIdAsync(Guid copropertyId)
        {
            // This needs a specific implementation in the repository
            var all = _maintenanceRepository.GetAll();
            return await Task.FromResult(all.Where(m => m.CopropertyId == copropertyId).ToList());
        }

        public async Task<IEnumerable<MaintenanceRequest>> GetByRequesterAsync(Guid userId)
        {
            return await _maintenanceRepository.GetByRequesterAsync(userId);
        }

        public async Task UpdateAsync(MaintenanceRequest request)
        {
            await _maintenanceRepository.UpdateAsync(request);
        }
    }
}
