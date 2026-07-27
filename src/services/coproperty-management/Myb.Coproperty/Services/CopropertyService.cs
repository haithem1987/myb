using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.Services
{
    public class CopropertyService : ICopropertyService
    {
        private readonly ICopropertyRepository _copropertyRepository;
        private readonly IDbContextFactory<CopropertyDbContext> _contextFactory;

        public CopropertyService(
            ICopropertyRepository copropertyRepository,
            IDbContextFactory<CopropertyDbContext> contextFactory)
        {
            _copropertyRepository = copropertyRepository;
            _contextFactory = contextFactory;
        }

        public async Task<Models.Coproperty> CreateAsync(Models.Coproperty coproperty)
        {
            if (coproperty == null)
                throw new ArgumentNullException(nameof(coproperty), "Coproperty cannot be null");
            
            // Reset timestamps to null so the database defaults apply
            coproperty.CreatedAt = null;
            coproperty.UpdatedAt = null;
            
            var result = await _copropertyRepository.InsertAsync(coproperty);
            
            if (result.Errors != null && result.Errors.Any())
            {
                var errorMessage = string.Join(", ", result.Errors);
                throw new InvalidOperationException($"Failed to create coproperty: {errorMessage}");
            }
            
            if (result.Entity == null)
            {
                throw new InvalidOperationException("Failed to create coproperty: Entity was not returned");
            }
            
            return result.Entity;
        }

        public async Task DeleteAsync(Guid id)
        {
            var coproperty = _copropertyRepository.GetById(id);
            
            if (coproperty == null)
                throw new InvalidOperationException($"Coproperty with ID {id} not found");

            // Preserve historical Call for Funds data: block deletion instead of letting
            // the FK cascade destroy financial records tied to this coproperty.
            using (var context = _contextFactory.CreateDbContext())
            {
                var hasFundCalls = await context.FundCalls.AnyAsync(f => f.CopropertyId == id);
                if (hasFundCalls)
                {
                    throw new InvalidOperationException(
                        $"Cannot delete coproperty '{coproperty.Name}' - it has associated Call for Funds (appels de fonds) records. " +
                        $"These are kept for financial history and must not be removed.");
                }
            }

            // Prevent deletion if coproperty has associated units
            if (coproperty.Units != null && coproperty.Units.Any())
            {
                throw new InvalidOperationException(
                    $"Cannot delete coproperty '{coproperty.Name}' - it has {coproperty.Units.Count} associated unit(s). " +
                    $"Please remove all units before deleting this coproperty.");
            }
            
            // Prevent deletion if coproperty has associated charges
            if (coproperty.Charges != null && coproperty.Charges.Any())
            {
                throw new InvalidOperationException(
                    $"Cannot delete coproperty '{coproperty.Name}' - it has {coproperty.Charges.Count} associated charge(s). " +
                    $"Please remove all charges before deleting this coproperty.");
            }
            
            // Prevent deletion if coproperty has associated maintenance requests
            if (coproperty.MaintenanceRequests != null && coproperty.MaintenanceRequests.Any())
            {
                throw new InvalidOperationException(
                    $"Cannot delete coproperty '{coproperty.Name}' - it has associated maintenance requests. " +
                    $"Please remove these before deleting this coproperty.");
            }
            
            await _copropertyRepository.DeleteAsync(id);
        }

        public async Task<IEnumerable<Models.Coproperty>> GetAllAsync(Guid? managerId = null)
        {
            if (managerId.HasValue)
                return await _copropertyRepository.GetByManagerIdAsync(managerId.Value);

            return await Task.FromResult(_copropertyRepository.GetAll().ToList());
        }

        public async Task<Models.Coproperty> GetByIdAsync(Guid id)
        {
            return await Task.FromResult(_copropertyRepository.GetById(id)!);
        }

        public async Task<Models.Coproperty> GetByNameAsync(string name, Guid? excludeId = null)
        {
            return await Task.FromResult(_copropertyRepository.GetByName(name, excludeId)!);
        }

        public async Task<IEnumerable<Models.Coproperty>> GetByManagerIdAsync(Guid managerId)
        {
            return await _copropertyRepository.GetByManagerIdAsync(managerId);
        }

        public async Task UpdateAsync(Models.Coproperty coproperty)
        {
            await _copropertyRepository.UpdateAsync(coproperty);
        }
    }
}
