using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using Myb.Common.Repositories;

namespace Myb.Coproperty.Infrastructure.Repositories
{
    public class OwnerRepository : GenericRepository<Guid, Owner, CopropertyDbContext>, IOwnerRepository
    {
        public OwnerRepository(IDbContextFactory<CopropertyDbContext> contextFactory) : base(contextFactory)
        {
        }

        public async Task<Owner?> GetByIdWithUnitsAsync(Guid id)
        {
            return await GetAll()
                .Include(o => o.OwnerUnits)
                    .ThenInclude(ou => ou.Unit)
                .FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<Owner?> GetByUserIdAsync(Guid userId)
        {
            return await GetAll()
                .Include(o => o.OwnerUnits)
                    .ThenInclude(ou => ou.Unit)
                .FirstOrDefaultAsync(o => o.UserId == userId);
        }

        public async Task<IEnumerable<Owner>> GetByCopropertyIdAsync(Guid copropertyId)
        {
            return await GetAll()
                .Include(o => o.OwnerUnits)
                    .ThenInclude(ou => ou.Unit)
                .Where(o => o.OwnerUnits.Any(ou => ou.Unit.CopropertyId == copropertyId))
                .ToListAsync();
        }

        public async Task<IEnumerable<Owner>> GetByUnitIdAsync(Guid unitId)
        {
            return await GetAll()
                .Include(o => o.OwnerUnits)
                    .ThenInclude(ou => ou.Unit)
                .Where(o => o.OwnerUnits.Any(ou => ou.UnitId == unitId))
                .ToListAsync();
        }
    }
}
