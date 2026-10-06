using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Models;
using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Infrastructure.Data;

namespace Myb.Coproperty.Services
{
    public class MaintenanceService : IMaintenanceService
    {
        private readonly IMaintenanceRepository _maintenanceRepository;
        private readonly IDbContextFactory<CopropertyDbContext> _contextFactory;

        public MaintenanceService(
            IMaintenanceRepository maintenanceRepository,
            IDbContextFactory<CopropertyDbContext> contextFactory)
        {
            _maintenanceRepository = maintenanceRepository;
            _contextFactory = contextFactory;
        }

        public async Task<MaintenanceRequest> CreateAsync(MaintenanceRequest request)
        {
            await EnsureCopropertyIsActiveAsync(request.CopropertyId);
            var result = await _maintenanceRepository.InsertAsync(request);
            
            if (result.Errors != null && result.Errors.Any())
            {
                throw new InvalidOperationException($"Failed to create maintenance request: {string.Join(", ", result.Errors)}");
            }
            
            if (result.Entity == null)
            {
                throw new InvalidOperationException("Failed to create maintenance request: Entity was not returned");
            }
            
            return result.Entity;
        }

        public async Task DeleteAsync(Guid id)
        {
            var request = _maintenanceRepository.GetById(id)
                ?? throw new InvalidOperationException($"Maintenance request with ID {id} not found");
            await EnsureCopropertyIsActiveAsync(request.CopropertyId);
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
            var existing = _maintenanceRepository.GetById(request.Id)
                ?? throw new InvalidOperationException($"Maintenance request with ID {request.Id} not found");
            await EnsureCopropertyIsActiveAsync(existing.CopropertyId);
            await EnsureCopropertyIsActiveAsync(request.CopropertyId);
            await _maintenanceRepository.UpdateAsync(request);
        }

        private async Task EnsureCopropertyIsActiveAsync(Guid copropertyId)
        {
            await using var context = await _contextFactory.CreateDbContextAsync();
            if (!await context.Coproperties.AnyAsync(c => c.Id == copropertyId && c.IsActive))
                throw new InvalidOperationException(
                    "Les interventions d'une copropriété inactive sont en lecture seule.");
        }
    }
}
