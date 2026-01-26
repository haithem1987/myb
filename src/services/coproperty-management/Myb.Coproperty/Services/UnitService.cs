using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.Services
{
    public class UnitService : IUnitService
    {
        private readonly IUnitRepository _unitRepository;

        public UnitService(IUnitRepository unitRepository)
        {
            _unitRepository = unitRepository;
        }

        public async Task<Unit> CreateAsync(Unit unit)
        {
            var result = await _unitRepository.InsertAsync(unit);
            
            if (result.Errors != null && result.Errors.Any())
            {
                throw new InvalidOperationException($"Failed to create unit: {string.Join(", ", result.Errors)}");
            }
            
            if (result.Entity == null)
            {
                throw new InvalidOperationException("Failed to create unit: Entity was not returned");
            }
            
            return result.Entity;
        }

        public async Task DeleteAsync(Guid id)
        {
            await _unitRepository.DeleteAsync(id);
        }

        public async Task<Unit> GetByIdAsync(Guid id)
        {
            return await Task.FromResult(_unitRepository.GetById(id)!);
        }

        public async Task<IEnumerable<Unit>> GetByCopropertyIdAsync(Guid copropertyId)
        {
            return await _unitRepository.GetByCopropertyIdAsync(copropertyId);
        }

        public async Task<IEnumerable<Unit>> GetByOwnerIdAsync(Guid ownerId)
        {
            return await _unitRepository.GetByOwnerIdAsync(ownerId);
        }

        public async Task UpdateAsync(Unit unit)
        {
            await _unitRepository.UpdateAsync(unit);
        }
    }
}
