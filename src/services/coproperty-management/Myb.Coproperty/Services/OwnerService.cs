using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.Services
{
    public class OwnerService : IOwnerService
    {
        private readonly IOwnerRepository _ownerRepository;

        public OwnerService(IOwnerRepository ownerRepository)
        {
            _ownerRepository = ownerRepository;
        }

        public async Task<Owner> CreateAsync(Owner owner)
        {
            var result = await _ownerRepository.InsertAsync(owner);
            
            if (result.Errors != null && result.Errors.Any())
            {
                throw new InvalidOperationException($"Failed to create owner: {string.Join(", ", result.Errors)}");
            }
            
            if (result.Entity == null)
            {
                throw new InvalidOperationException("Failed to create owner: Entity was not returned");
            }
            
            return result.Entity;
        }

        public async Task DeleteAsync(Guid id)
        {
            await _ownerRepository.DeleteAsync(id);
        }

        public async Task<Owner> GetByIdAsync(Guid id)
        {
            var owner = await _ownerRepository.GetByIdWithUnitsAsync(id);
            if (owner == null)
            {
                throw new InvalidOperationException($"Owner with ID {id} not found");
            }
            return owner;
        }

        public async Task<Owner?> GetByUserIdAsync(Guid userId)
        {
            return await _ownerRepository.GetByUserIdAsync(userId);
        }

        public async Task<IEnumerable<Owner>> GetByCopropertyIdAsync(Guid copropertyId)
        {
            return await _ownerRepository.GetByCopropertyIdAsync(copropertyId);
        }

        public async Task<IEnumerable<Owner>> GetByUnitIdAsync(Guid unitId)
        {
            return await _ownerRepository.GetByUnitIdAsync(unitId);
        }

        public async Task UpdateAsync(Owner owner)
        {
            await _ownerRepository.UpdateAsync(owner);
        }
    }
}
