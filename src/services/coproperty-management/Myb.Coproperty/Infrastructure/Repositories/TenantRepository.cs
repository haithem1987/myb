using Microsoft.EntityFrameworkCore;
using Myb.Common.Repositories;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.Infrastructure.Repositories;

public class TenantRepository : GenericRepository<Guid, Tenant, CopropertyDbContext>, ITenantRepository
{
    private readonly IDbContextFactory<CopropertyDbContext> _contextFactory;

    public TenantRepository(IDbContextFactory<CopropertyDbContext> contextFactory) : base(contextFactory)
    {
        _contextFactory = contextFactory;
    }

    public async Task<Tenant?> GetByIdWithUnitAsync(Guid id)
    {
        return await GetAll()
            .Include(t => t.Unit)
                .ThenInclude(u => u.Coproperty)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<IEnumerable<Tenant>> GetByCopropertyIdAsync(Guid copropertyId)
    {
        return await GetAll()
            .Include(t => t.Unit)
                .ThenInclude(u => u.Coproperty)
            .Where(t => t.Unit.CopropertyId == copropertyId)
            .OrderBy(t => t.LastName)
            .ThenBy(t => t.FirstName)
            .ToListAsync();
    }

    public async Task<IEnumerable<Tenant>> GetByUnitIdAsync(Guid unitId)
    {
        return await GetAll()
            .Include(t => t.Unit)
                .ThenInclude(u => u.Coproperty)
            .Where(t => t.UnitId == unitId)
            .OrderByDescending(t => t.IsActive)
            .ThenByDescending(t => t.LeaseStartDate)
            .ToListAsync();
    }

    public async Task<Tenant?> GetActiveByUnitIdAsync(Guid unitId)
    {
        return await GetAll()
            .Include(t => t.Unit)
                .ThenInclude(u => u.Coproperty)
            .FirstOrDefaultAsync(t => t.UnitId == unitId && t.IsActive);
    }

    public async Task<Tenant> UpdateTenantAsync(Tenant tenant)
    {
        await using var context = await _contextFactory.CreateDbContextAsync();
        var existing = await context.Tenants.FirstOrDefaultAsync(t => t.Id == tenant.Id);
        if (existing == null)
        {
            throw new InvalidOperationException($"Tenant with ID {tenant.Id} not found");
        }

        existing.UnitId = tenant.UnitId;
        existing.FirstName = tenant.FirstName;
        existing.LastName = tenant.LastName;
        existing.Email = tenant.Email;
        existing.Phone = tenant.Phone;
        existing.LeaseStartDate = tenant.LeaseStartDate;
        existing.LeaseEndDate = tenant.LeaseEndDate;
        existing.MonthlyRent = tenant.MonthlyRent;
        existing.DepositAmount = tenant.DepositAmount;
        existing.IsActive = tenant.IsActive;
        existing.Notes = tenant.Notes;
        existing.UpdatedAt = tenant.UpdatedAt ?? DateTime.UtcNow;

        await context.SaveChangesAsync();
        return existing;
    }
}
