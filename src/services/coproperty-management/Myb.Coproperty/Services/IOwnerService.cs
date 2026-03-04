using Myb.Coproperty.Models;

namespace Myb.Coproperty.Services
{
    public interface IOwnerService
    {
        Task<IEnumerable<Owner>> GetByUnitIdAsync(Guid unitId);
        Task<Owner> GetByIdAsync(Guid id);
        Task<Owner?> GetByUserIdAsync(Guid userId);
        Task<Owner> CreateAsync(Owner owner);
        Task UpdateAsync(Owner owner);
        Task DeleteAsync(Guid id);
        Task<IEnumerable<Owner>> GetByCopropertyIdAsync(Guid copropertyId);
    }
}
