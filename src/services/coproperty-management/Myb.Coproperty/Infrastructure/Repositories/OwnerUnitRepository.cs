using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using Myb.Common.Repositories;

namespace Myb.Coproperty.Infrastructure.Repositories
{
    public class OwnerUnitRepository : GenericRepository<Guid, OwnerUnit, CopropertyDbContext>, IOwnerUnitRepository
    {
        public OwnerUnitRepository(IDbContextFactory<CopropertyDbContext> contextFactory) : base(contextFactory)
        {
        }

        public async Task<IEnumerable<OwnerUnit>> GetByOwnerIdAsync(Guid ownerId)
        {
            return await GetAll()
                .Where(ou => ou.OwnerId == ownerId)
                .Include(ou => ou.Unit)
                .ToListAsync();
        }

        public async Task<IEnumerable<OwnerUnit>> GetByUnitIdAsync(Guid unitId)
        {
            return await GetAll()
                .Where(ou => ou.UnitId == unitId)
                .Include(ou => ou.Owner)
                .ToListAsync();
        }
    }
}
