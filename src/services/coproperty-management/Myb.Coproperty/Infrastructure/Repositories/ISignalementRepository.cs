using Myb.Coproperty.Models;
using Myb.Common.Repositories;

namespace Myb.Coproperty.Infrastructure.Repositories
{
    public interface ISignalementRepository : IGenericRepository<Guid, Signalement, Data.CopropertyDbContext>
    {
        Task<IEnumerable<Signalement>> GetByCopropertyIdAsync(Guid copropertyId);
        Task<IEnumerable<Signalement>> GetByReporterAsync(Guid userId);
        Task<IEnumerable<Signalement>> GetByStatusAsync(Guid copropertyId, SignalementStatus status);
    }
}
