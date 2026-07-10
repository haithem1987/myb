using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.Services;

public class TenantService : ITenantService
{
    private readonly ITenantRepository _tenantRepository;
    private readonly IUnitRepository _unitRepository;

    public TenantService(ITenantRepository tenantRepository, IUnitRepository unitRepository)
    {
        _tenantRepository = tenantRepository;
        _unitRepository = unitRepository;
    }

    public async Task<Tenant> GetByIdAsync(Guid id)
    {
        var tenant = await _tenantRepository.GetByIdWithUnitAsync(id);
        if (tenant == null)
        {
            throw new InvalidOperationException($"Tenant with ID {id} not found");
        }

        return tenant;
    }

    public async Task<IEnumerable<Tenant>> GetByCopropertyIdAsync(Guid copropertyId)
    {
        return await _tenantRepository.GetByCopropertyIdAsync(copropertyId);
    }

    public async Task<IEnumerable<Tenant>> GetByUnitIdAsync(Guid unitId)
    {
        return await _tenantRepository.GetByUnitIdAsync(unitId);
    }

    public async Task<Tenant> CreateAsync(Tenant tenant)
    {
        await EnsureUnitCanReceiveActiveTenant(tenant.UnitId, tenant.IsActive, null);

        tenant.Id = tenant.Id == Guid.Empty ? Guid.NewGuid() : tenant.Id;
        tenant.CreatedAt = DateTime.UtcNow;
        tenant.UpdatedAt = DateTime.UtcNow;

        var result = await _tenantRepository.InsertAsync(tenant);
        if (result.Errors != null && result.Errors.Any())
        {
            throw new InvalidOperationException($"Failed to create tenant: {string.Join(", ", result.Errors)}");
        }

        if (result.Entity == null)
        {
            throw new InvalidOperationException("Failed to create tenant: Entity was not returned");
        }

        await SyncUnitOccupancyAsync(tenant.UnitId);
        return result.Entity;
    }

    public async Task<Tenant> UpdateAsync(Tenant tenant)
    {
        var existingTenant = await GetByIdAsync(tenant.Id);
        var previousUnitId = existingTenant.UnitId;

        await EnsureUnitCanReceiveActiveTenant(tenant.UnitId, tenant.IsActive, tenant.Id);

        tenant.CreatedAt = existingTenant.CreatedAt;
        tenant.UpdatedAt = DateTime.UtcNow;

        await _tenantRepository.UpdateTenantAsync(tenant);

        await SyncUnitOccupancyAsync(tenant.UnitId);
        if (previousUnitId != tenant.UnitId)
        {
            await SyncUnitOccupancyAsync(previousUnitId);
        }

        return await GetByIdAsync(tenant.Id);
    }

    public async Task DeleteAsync(Guid id)
    {
        var tenant = await GetByIdAsync(id);
        await _tenantRepository.DeleteAsync(id);
        await SyncUnitOccupancyAsync(tenant.UnitId);
    }

    private async Task EnsureUnitCanReceiveActiveTenant(Guid unitId, bool isActive, Guid? currentTenantId)
    {
        if (!isActive)
        {
            return;
        }

        var activeTenant = await _tenantRepository.GetActiveByUnitIdAsync(unitId);
        if (activeTenant != null && activeTenant.Id != currentTenantId)
        {
            throw new InvalidOperationException("This unit already has an active tenant");
        }
    }

    private async Task SyncUnitOccupancyAsync(Guid unitId)
    {
        var unit = _unitRepository.GetById(unitId);
        if (unit == null)
        {
            return;
        }

        unit.IsOccupied = await _tenantRepository.GetActiveByUnitIdAsync(unitId) != null;
        unit.UpdatedAt = DateTime.UtcNow;
        await _unitRepository.UpdateAsync(unit);
    }
}
