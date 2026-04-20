using Microsoft.EntityFrameworkCore;
using Myb.Common.Repositories;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.Infrastructure.Repositories;

public class InterventionRepository : GenericRepository<Guid, Intervention, CopropertyDbContext>, IInterventionRepository
{
    public InterventionRepository(IDbContextFactory<CopropertyDbContext> contextFactory) : base(contextFactory)
    {
    }

    public async Task<IEnumerable<Intervention>> GetByCopropertyIdAsync(Guid copropertyId)
    {
        return await GetAll()
            .Where(i => i.CopropertyId == copropertyId)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Intervention>> GetByStatusAsync(Guid copropertyId, InterventionStatus status)
    {
        return await GetAll()
            .Where(i => i.CopropertyId == copropertyId && i.Status == status)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();
    }
}
