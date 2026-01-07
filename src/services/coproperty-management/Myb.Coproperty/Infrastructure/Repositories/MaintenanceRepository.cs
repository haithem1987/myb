using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using Myb.Common.Repositories;

namespace Myb.Coproperty.Infrastructure.Repositories
{
    public class MaintenanceRepository : GenericRepository<Guid, MaintenanceRequest, CopropertyDbContext>, IMaintenanceRepository
    {
        public MaintenanceRepository(IDbContextFactory<CopropertyDbContext> contextFactory) : base(contextFactory)
        {
        }

        public async Task<IEnumerable<MaintenanceRequest>> GetByRequesterAsync(Guid userId)
        {
            return await GetAll()
                .Where(m => m.RequestedBy == userId)
                .ToListAsync();
        }
    }
}
