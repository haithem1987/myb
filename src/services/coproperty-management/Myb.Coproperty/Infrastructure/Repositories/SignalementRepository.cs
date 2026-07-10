using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using Myb.Common.Repositories;

namespace Myb.Coproperty.Infrastructure.Repositories
{
    public class SignalementRepository : GenericRepository<Guid, Signalement, CopropertyDbContext>, ISignalementRepository
    {
        public SignalementRepository(IDbContextFactory<CopropertyDbContext> contextFactory) : base(contextFactory)
        {
        }

        public async Task<IEnumerable<Signalement>> GetByCopropertyIdAsync(Guid copropertyId)
        {
            return await GetAll()
                .Where(s => s.CopropertyId == copropertyId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Signalement>> GetByReporterAsync(Guid userId)
        {
            return await GetAll()
                .Where(s => s.ReportedBy == userId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Signalement>> GetByStatusAsync(Guid copropertyId, SignalementStatus status)
        {
            return await GetAll()
                .Where(s => s.CopropertyId == copropertyId && s.Status == status)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
        }
    }
}
