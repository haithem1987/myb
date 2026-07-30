using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using Myb.Common.Repositories;

namespace Myb.Coproperty.Infrastructure.Repositories
{
    public class UnitRepository : GenericRepository<Guid, Unit, CopropertyDbContext>, IUnitRepository
    {
        public UnitRepository(IDbContextFactory<CopropertyDbContext> contextFactory) : base(contextFactory)
        {
        }

        public async Task<IEnumerable<Unit>> GetAllAsync()
        {
            return await GetAll()
                .Include(u => u.Coproperty)
                .ToListAsync();
        }

        public async Task<IEnumerable<Unit>> GetByCopropertyIdAsync(Guid copropertyId)
        {
            return await GetAll()
                .Include(u => u.Coproperty)
                .Where(u => u.CopropertyId == copropertyId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Unit>> GetByOwnerIdAsync(Guid ownerId)
        {
            return await GetAll()
                .Where(u => u.OwnerUnits.Any(ou => ou.Owner.UserId == ownerId && ou.EndDate == null))
                .Include(u => u.Coproperty)
                .ToListAsync();
        }
    }
}
