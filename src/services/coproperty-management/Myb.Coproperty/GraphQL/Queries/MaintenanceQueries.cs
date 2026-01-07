using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Queries
{
    [ExtendObjectType("Query")]
    public class MaintenanceQueries
    {
        public async Task<IEnumerable<MaintenanceRequest>> GetMaintenanceRequests(Guid copropertyId, [Service] IMaintenanceService maintenanceService) =>
            await maintenanceService.GetByCopropertyIdAsync(copropertyId);

        public async Task<MaintenanceRequest> GetMaintenanceRequestById(Guid id, [Service] IMaintenanceService maintenanceService) =>
            await maintenanceService.GetByIdAsync(id);

        public async Task<IEnumerable<MaintenanceRequest>> GetMyMaintenanceRequests(Guid userId, [Service] IMaintenanceService maintenanceService) =>
            await maintenanceService.GetByRequesterAsync(userId);
    }
}
