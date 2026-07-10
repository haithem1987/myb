using Myb.Coproperty.Models;

namespace Myb.Coproperty.Services
{
    public interface ISignalementService
    {
        Task<IEnumerable<Signalement>> GetByCopropertyIdAsync(Guid copropertyId);
        Task<IEnumerable<Signalement>> GetByReporterAsync(Guid userId);
        Task<IEnumerable<Signalement>> GetByStatusAsync(Guid copropertyId, SignalementStatus status);
        Task<Signalement?> GetByIdAsync(Guid id);
        Task<Signalement> CreateAsync(Signalement signalement);
        Task<Signalement> UpdateStatusAsync(Guid id, SignalementStatus status, string? syndicComment);
        Task IncrementViewsAsync(Guid id);
        Task DeleteAsync(Guid id);
    }
}
