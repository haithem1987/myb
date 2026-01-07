using Myb.Coproperty.Models;
using Myb.Common.Repositories;

namespace Myb.Coproperty.Infrastructure.Repositories
{
    public interface IMaintenanceRepository : IGenericRepository<Guid, MaintenanceRequest, Data.CopropertyDbContext>
    {
        Task<IEnumerable<MaintenanceRequest>> GetByRequesterAsync(Guid userId);
    }
}
