using Microsoft.EntityFrameworkCore;
using Myb.Common.Infrastructure.Repositories;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.Infrastructure.Repositories;

public class AssemblyRepository : GenericRepository<Guid, Assembly, CopropertyDbContext>, IAssemblyRepository
{
    public AssemblyRepository(CopropertyDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Assembly>> GetByCopropertyIdAsync(Guid copropertyId)
    {
        return await _context.Set<Assembly>()
            .Where(a => a.CopropertyId == copropertyId && a.IsActive)
            .OrderByDescending(a => a.MeetingDate)
            .Include(a => a.Attendances)
            .ToListAsync();
    }

    public async Task<IEnumerable<Assembly>> GetUpcomingAssembliesAsync(Guid copropertyId)
    {
        var now = DateTime.UtcNow;
        return await _context.Set<Assembly>()
            .Where(a => a.CopropertyId == copropertyId 
                     && a.IsActive 
                     && a.MeetingDate > now 
                     && a.Status != AssemblyStatus.Cancelled)
            .OrderBy(a => a.MeetingDate)
            .Include(a => a.Attendances)
            .ToListAsync();
    }
}
