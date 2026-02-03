using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Models;

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

    public AssemblyService(IAssemblyRepository assemblyRepository)
    {
        _assemblyRepository = assemblyRepository;
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
        assembly.CreatedAt = DateTime.UtcNow;
        assembly.UpdatedAt = DateTime.UtcNow;
        return await _assemblyRepository.CreateAsync(assembly);
    }

    public async Task UpdateAsync(Assembly assembly)
    {
        assembly.UpdatedAt = DateTime.UtcNow;
        await _assemblyRepository.UpdateAsync(assembly);
    }

    public async Task DeleteAsync(Guid id)
    {
        var assembly = await _assemblyRepository.GetByIdAsync(id);
        if (assembly != null)
        {
            assembly.IsActive = false;
            await _assemblyRepository.UpdateAsync(assembly);
        }
    }
}
