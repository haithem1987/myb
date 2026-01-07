using Myb.Coproperty.Models;

namespace Myb.Coproperty.Services
{
    public interface IUnitService
    {
        Task<IEnumerable<Unit>> GetByCopropertyIdAsync(Guid copropertyId);
        Task<Unit> GetByIdAsync(Guid id);
        Task<Unit> CreateAsync(Unit unit);
        Task UpdateAsync(Unit unit);
        Task DeleteAsync(Guid id);
        Task<IEnumerable<Unit>> GetByOwnerIdAsync(Guid ownerId);
    }
}
