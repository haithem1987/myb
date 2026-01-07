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

        public async Task<IEnumerable<Owner>> GetByCopropertyIdAsync(Guid copropertyId)
        {
            return await GetAll()
                .Where(o => o.Unit.CopropertyId == copropertyId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Owner>> GetByUnitIdAsync(Guid unitId)
        {
            return await GetAll()
                .Where(o => o.UnitId == unitId)
                .ToListAsync();
        }
    }
}
