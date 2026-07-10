using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Queries;

[ExtendObjectType("Query")]
public class DiscussionQueries
{
    public async Task<IEnumerable<Discussion>> GetDiscussions(
        Guid copropertyId,
        [Service] IDbContextFactory<CopropertyDbContext> factory)
    {
        await using var db = await factory.CreateDbContextAsync();
        return await db.Discussions.AsNoTracking()
            .Where(x => x.CopropertyId == copropertyId)
            .Include(x => x.Coproperty)
            .Include(x => x.Messages.OrderBy(m => m.CreatedAt))
            .OrderByDescending(x => x.IsPinned).ThenByDescending(x => x.UpdatedAt)
            .ToListAsync();
    }
}
