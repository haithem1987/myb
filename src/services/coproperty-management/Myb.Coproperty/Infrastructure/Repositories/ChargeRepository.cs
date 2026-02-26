using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using Myb.Common.Repositories;

namespace Myb.Coproperty.Infrastructure.Repositories
{
    public class ChargeRepository : GenericRepository<Guid, Charge, CopropertyDbContext>, IChargeRepository
    {
        public ChargeRepository(IDbContextFactory<CopropertyDbContext> contextFactory) : base(contextFactory)
        {
        }

        public async Task<IEnumerable<Charge>> GetAllAsync()
        {
            return await GetAll().ToListAsync();
        }

        public async Task<IEnumerable<Charge>> GetActiveChargesAsync(Guid copropertyId)
        {
            return await GetAll()
                .Where(c => c.CopropertyId == copropertyId && c.IsActive)
                .ToListAsync();
        }
    }
}
