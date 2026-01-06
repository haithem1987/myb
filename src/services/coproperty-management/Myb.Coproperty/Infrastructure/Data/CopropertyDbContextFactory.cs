using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Myb.Coproperty.Infrastructure.Data;

/// <summary>
/// Design-time factory for creating DbContext instances during migrations
/// </summary>
public class CopropertyDbContextFactory : IDesignTimeDbContextFactory<CopropertyDbContext>
{
    public CopropertyDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<CopropertyDbContext>();
        optionsBuilder.UseNpgsql("Host=localhost;Port=5435;Database=copropertyDB;Username=postgres;Password=coproperty-pwd");

        return new CopropertyDbContext(optionsBuilder.Options);
    }
}
