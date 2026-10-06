using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Models;
using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Infrastructure.Data;

namespace Myb.Coproperty.Services;

public interface IAssemblyService
{
    Task<IEnumerable<Assembly>> GetByCopropertyIdAsync(Guid copropertyId);
    Task<IEnumerable<Assembly>> GetUpcomingAssembliesAsync(Guid copropertyId);
    Task<Assembly> GetByIdAsync(Guid id);
    Task<Assembly> CreateAsync(Assembly assembly);
    Task UpdateAsync(Assembly assembly);
    Task DeleteAsync(Guid id);
}

public class AssemblyService : IAssemblyService
{
    private readonly IAssemblyRepository _assemblyRepository;
    private readonly IDbContextFactory<CopropertyDbContext> _contextFactory;

    public AssemblyService(
        IAssemblyRepository assemblyRepository,
        IDbContextFactory<CopropertyDbContext> contextFactory)
    {
        _assemblyRepository = assemblyRepository;
        _contextFactory = contextFactory;
    }

    public async Task<IEnumerable<Assembly>> GetByCopropertyIdAsync(Guid copropertyId)
    {
        return await _assemblyRepository.GetByCopropertyIdAsync(copropertyId);
    }

    public async Task<IEnumerable<Assembly>> GetUpcomingAssembliesAsync(Guid copropertyId)
    {
        return await _assemblyRepository.GetUpcomingAssembliesAsync(copropertyId);
    }

    public async Task<Assembly> GetByIdAsync(Guid id)
    {
        return await _assemblyRepository.GetByIdAsync(id);
    }

    public async Task<Assembly> CreateAsync(Assembly assembly)
    {
        await EnsureCopropertyIsActiveAsync(assembly.CopropertyId);
        assembly.CreatedAt = DateTime.UtcNow;
        assembly.UpdatedAt = DateTime.UtcNow;
        var result = await _assemblyRepository.InsertAsync(assembly);
        return result.Entity ?? throw new InvalidOperationException("Failed to create assembly");
    }

    public async Task UpdateAsync(Assembly assembly)
    {
        await EnsureCopropertyIsActiveAsync(assembly.CopropertyId);
        assembly.UpdatedAt = DateTime.UtcNow;
        await _assemblyRepository.UpdateAsync(assembly);
    }

    public async Task DeleteAsync(Guid id)
    {
        var assembly = await _assemblyRepository.GetByIdAsync(id);
        if (assembly != null)
        {
            await EnsureCopropertyIsActiveAsync(assembly.CopropertyId);
            assembly.IsActive = false;
            await _assemblyRepository.UpdateAsync(assembly);
        }
    }

    private async Task EnsureCopropertyIsActiveAsync(Guid copropertyId)
    {
        await using var context = await _contextFactory.CreateDbContextAsync();
        if (!await context.Coproperties.AnyAsync(c => c.Id == copropertyId && c.IsActive))
            throw new InvalidOperationException(
                "Les assemblées d'une copropriété inactive sont en lecture seule.");
    }
}
