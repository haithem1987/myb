using Myb.Coproperty.Models;

namespace Myb.Coproperty.Services
{
    public interface ICopropertyService
    {
        Task<IEnumerable<Models.Coproperty>> GetAllAsync();
        Task<Models.Coproperty> GetByIdAsync(Guid id);
        Task<Models.Coproperty> GetByNameAsync(string name, Guid? excludeId = null);
        Task<Models.Coproperty> CreateAsync(Models.Coproperty coproperty);
        Task UpdateAsync(Models.Coproperty coproperty);
        Task DeleteAsync(Guid id);
        Task<IEnumerable<Models.Coproperty>> GetByManagerIdAsync(Guid managerId);
    }
}
