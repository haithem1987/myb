using Myb.Common.Repositories;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.Infrastructure.Repositories;

public interface IInterventionRepository : IGenericRepository<Guid, Intervention, CopropertyDbContext>
{
    Task<IEnumerable<Intervention>> GetByCopropertyIdAsync(Guid copropertyId);
    Task<IEnumerable<Intervention>> GetByStatusAsync(Guid copropertyId, InterventionStatus status);
}
