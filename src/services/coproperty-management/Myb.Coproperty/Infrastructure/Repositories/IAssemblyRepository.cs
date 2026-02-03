using Myb.Common.Infrastructure.Repositories;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.Infrastructure.Repositories;

public interface IAssemblyRepository : IGenericRepository<Guid, Assembly, CopropertyDbContext>
{
    Task<IEnumerable<Assembly>> GetByCopropertyIdAsync(Guid copropertyId);
    Task<IEnumerable<Assembly>> GetUpcomingAssembliesAsync(Guid copropertyId);
}
