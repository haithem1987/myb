using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.Services
{
    public class CopropertyService : ICopropertyService
    {
        private readonly ICopropertyRepository _copropertyRepository;

        public CopropertyService(ICopropertyRepository copropertyRepository)
        {
            _copropertyRepository = copropertyRepository;
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

            // Financial records must remain queryable for audit/history. Hide the
            // coproperty from operational screens without physically removing it
            // or any of its units, charges, invoices, or fund calls.
            coproperty.IsDeleted = true;
            coproperty.IsActive = false;
            coproperty.DeletedAt = DateTime.UtcNow;
            coproperty.UpdatedAt = coproperty.DeletedAt;
            await _copropertyRepository.UpdateAsync(coproperty);
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
