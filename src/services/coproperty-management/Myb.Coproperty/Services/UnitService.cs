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
            unit.UnitNumber = unit.UnitNumber?.Trim() ?? string.Empty;

            var duplicateExists = _unitRepository.GetAll().Any(u =>
                u.CopropertyId == unit.CopropertyId &&
                u.UnitNumber.ToLower() == unit.UnitNumber.ToLower());

            if (duplicateExists)
            {
                throw new InvalidOperationException("A unit with this number already exists in this coproperty.");
            }

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
            var unit = _unitRepository.GetById(id);
            if (unit == null)
            {
                throw new InvalidOperationException($"Unit with ID {id} not found");
            }

            var hasOwners = _unitRepository.GetAll().Any(u => u.Id == id && u.OwnerUnits.Any());
            if (hasOwners)
            {
                throw new InvalidOperationException(
                    $"Cannot delete unit '{unit.UnitNumber}' because it is associated with one or more owners. Remove owner associations first.");
            }

            var result = await _unitRepository.DeleteAsync(id);
            if (result.Errors != null && result.Errors.Any())
            {
                throw new InvalidOperationException($"Failed to delete unit: {string.Join(", ", result.Errors)}");
            }
        }

        public async Task<Unit> GetByIdAsync(Guid id)
        {
            return await Task.FromResult(_unitRepository.GetById(id)!);
        }

        public async Task<IEnumerable<Unit>> GetAllAsync()
        {
            return await _unitRepository.GetAllAsync();
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
            unit.UnitNumber = unit.UnitNumber?.Trim() ?? string.Empty;

            var duplicateExists = _unitRepository.GetAll().Any(u =>
                u.CopropertyId == unit.CopropertyId &&
                u.Id != unit.Id &&
                u.UnitNumber.ToLower() == unit.UnitNumber.ToLower());

            if (duplicateExists)
            {
                throw new InvalidOperationException("A unit with this number already exists in this coproperty.");
            }

            var result = await _unitRepository.UpdateAsync(unit);
            if (result.Errors != null && result.Errors.Any())
            {
                throw new InvalidOperationException($"Failed to update unit: {string.Join(", ", result.Errors)}");
            }
        }
    }
}
