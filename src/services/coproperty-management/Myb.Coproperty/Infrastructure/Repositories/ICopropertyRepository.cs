using Myb.Coproperty.Models;
using Myb.Common.Repositories;

namespace Myb.Coproperty.Infrastructure.Repositories
{
    public interface ICopropertyRepository : IGenericRepository<Guid, Models.Coproperty, Data.CopropertyDbContext>
    {
        Task<IEnumerable<Models.Coproperty>> GetByManagerIdAsync(Guid managerId);
    }
}
