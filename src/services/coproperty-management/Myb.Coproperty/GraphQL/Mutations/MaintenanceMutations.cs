using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Mutations
{
    [ExtendObjectType("Mutation")]
    public class MaintenanceMutations
    {
        public async Task<MaintenanceRequest> CreateMaintenanceRequest(MaintenanceRequest request, [Service] IMaintenanceService maintenanceService) =>
            await maintenanceService.CreateAsync(request);

        public async Task<MaintenanceRequest> UpdateMaintenanceRequest(MaintenanceRequest request, [Service] IMaintenanceService maintenanceService)
        {
            await maintenanceService.UpdateAsync(request);
            return request;
        }
    }
}
