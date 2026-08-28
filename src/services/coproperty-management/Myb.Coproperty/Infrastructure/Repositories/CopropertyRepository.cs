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

        public Models.Coproperty? GetByName(string name, Guid? managerId, Guid? excludeId = null)
        {
            var normalizedName = name.Trim().ToLower();
            var query = GetAll().Where(c =>
                c.ManagerId == managerId &&
                c.Name.Trim().ToLower() == normalizedName);
            
            if (excludeId.HasValue)
            {
                query = query.Where(c => c.Id != excludeId.Value);
            }
            
            return query.FirstOrDefault()!;
        }
    }
}
