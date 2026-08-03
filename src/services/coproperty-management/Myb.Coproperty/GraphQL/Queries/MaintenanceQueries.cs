using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;
using System.Security.Claims;

namespace Myb.Coproperty.GraphQL.Queries
{
    [ExtendObjectType("Query")]
    public class MaintenanceQueries
    {
        public async Task<IEnumerable<MaintenanceRequest>> GetMaintenanceRequests(
            Guid copropertyId,
            ClaimsPrincipal? user,
            [Service] IMaintenanceService maintenanceService,
            [Service] ICopropertyService copropertyService)
        {
            await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, copropertyId, copropertyService);
            return await maintenanceService.GetByCopropertyIdAsync(copropertyId);
        }

        public async Task<MaintenanceRequest> GetMaintenanceRequestById(
            Guid id,
            ClaimsPrincipal? user,
            [Service] IMaintenanceService maintenanceService,
            [Service] ICopropertyService copropertyService)
        {
            var request = await maintenanceService.GetByIdAsync(id);
            await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, request.CopropertyId, copropertyService);
            return request;
        }

        public async Task<IEnumerable<MaintenanceRequest>> GetMyMaintenanceRequests(
            Guid userId,
            ClaimsPrincipal? user,
            [Service] IMaintenanceService maintenanceService,
            [Service] ICopropertyService copropertyService)
        {
            var requests = await maintenanceService.GetByRequesterAsync(userId);
            var scopedIds = await CopropertyAccessControl.GetScopedCopropertyIdsAsync(user, copropertyService);
            if (scopedIds == null)
                return requests;

            return requests.Where(request => scopedIds.Contains(request.CopropertyId)).ToList();
        }
    }
}
