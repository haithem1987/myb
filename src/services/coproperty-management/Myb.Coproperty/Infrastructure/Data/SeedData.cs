using Myb.Coproperty.Models;

namespace Myb.Coproperty.Infrastructure.Data;

/// <summary>
/// Seed data for development and testing
/// NOTE: Seed data has been disabled. Create data via the frontend API instead.
/// </summary>
public static class SeedData
{
    /// <summary>
    /// Seed the database with sample data - DISABLED
    /// </summary>
    public static async Task SeedAsync(CopropertyDbContext context)
    {
        // Seed data is disabled. Create real data via the frontend GraphQL API.
        // This allows for proper data entry with validation and timestamps.
        await Task.CompletedTask;
    }
}
