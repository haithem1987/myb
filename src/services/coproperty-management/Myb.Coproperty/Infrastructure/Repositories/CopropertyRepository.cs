using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using Myb.Common.Repositories;

namespace Myb.Coproperty.Infrastructure.Repositories
{
    public class CopropertyRepository : GenericRepository<Guid, Models.Coproperty, CopropertyDbContext>, ICopropertyRepository
    {
        public CopropertyRepository(IDbContextFactory<CopropertyDbContext> contextFactory) : base(contextFactory)
        {
        }

        public async Task<IEnumerable<Models.Coproperty>> GetByManagerIdAsync(Guid managerId)
        {
            return await GetAll()
                .Where(c => c.ManagerId == managerId)
                .ToListAsync();
        }
    }
}
