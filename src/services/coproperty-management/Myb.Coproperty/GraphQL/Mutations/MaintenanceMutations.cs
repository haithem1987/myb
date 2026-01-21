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

        public async Task<MaintenanceRequest> AssignMaintenance(
            Guid id,
            Guid technicianId,
            [Service] IMaintenanceService maintenanceService)
        {
            var request = await maintenanceService.GetByIdAsync(id);
            if (request == null)
                throw new InvalidOperationException($"Maintenance request with ID {id} not found");

            request.AssignedTo = technicianId;
            request.Status = MaintenanceStatus.Assigned;
            request.UpdatedAt = DateTime.UtcNow;
            
            await maintenanceService.UpdateAsync(request);
            return request;
        }

        public async Task<MaintenanceRequest> UpdateMaintenanceStatus(
            Guid id,
            MaintenanceStatus status,
            [Service] IMaintenanceService maintenanceService)
        {
            var request = await maintenanceService.GetByIdAsync(id);
            if (request == null)
                throw new InvalidOperationException($"Maintenance request with ID {id} not found");

            request.Status = status;
            request.UpdatedAt = DateTime.UtcNow;
            
            if (status == MaintenanceStatus.Completed)
            {
                request.CompletedDate = DateTime.UtcNow;
            }
            
            await maintenanceService.UpdateAsync(request);
            return request;
        }

        public async Task<MaintenanceRequest> CompleteMaintenance(
            Guid id,
            decimal? actualCost,
            [Service] IMaintenanceService maintenanceService)
        {
            var request = await maintenanceService.GetByIdAsync(id);
            if (request == null)
                throw new InvalidOperationException($"Maintenance request with ID {id} not found");

            request.Status = MaintenanceStatus.Completed;
            request.CompletedDate = DateTime.UtcNow;
            request.ActualCost = actualCost;
            request.UpdatedAt = DateTime.UtcNow;
            
            await maintenanceService.UpdateAsync(request);
            return request;
        }
    }
}
