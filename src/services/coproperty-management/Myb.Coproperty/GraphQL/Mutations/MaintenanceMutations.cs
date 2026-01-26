using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;
using Myb.Coproperty.GraphQL.Types;

namespace Myb.Coproperty.GraphQL.Mutations
{
    [ExtendObjectType("Mutation")]
    public class MaintenanceMutations
    {
        /// <summary>
        /// Create a new maintenance request with dates as ISO 8601 strings.
        /// Uses CreateMaintenanceRequestInput to avoid DateTime parsing issues.
        /// </summary>
        public async Task<MaintenanceRequest> CreateMaintenanceRequestWithDates(
            CreateMaintenanceRequestInput requestInput,
            [Service] IMaintenanceService maintenanceService)
        {
            try
            {
                Console.WriteLine($"CreateMaintenanceRequestWithDates called: Title={requestInput.Title}");
                var requestEntity = requestInput.ToMaintenanceRequest();
                var result = await maintenanceService.CreateAsync(requestEntity);
                Console.WriteLine($"Maintenance request created successfully: Id={result.Id}");
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR in CreateMaintenanceRequestWithDates: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        /// <summary>
        /// Update an existing maintenance request with dates as ISO 8601 strings.
        /// Uses UpdateMaintenanceRequestInput to avoid DateTime parsing issues.
        /// </summary>
        public async Task<MaintenanceRequest> UpdateMaintenanceRequestWithDates(
            UpdateMaintenanceRequestInput requestInput,
            [Service] IMaintenanceService maintenanceService)
        {
            try
            {
                Console.WriteLine($"UpdateMaintenanceRequestWithDates called: Id={requestInput.Id}");
                var requestEntity = requestInput.ToMaintenanceRequest();
                await maintenanceService.UpdateAsync(requestEntity);
                var result = await maintenanceService.GetByIdAsync(requestEntity.Id);
                Console.WriteLine($"Maintenance request updated successfully: Id={result?.Id}");
                return result!;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR in UpdateMaintenanceRequestWithDates: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        [Obsolete("Use CreateMaintenanceRequestWithDates instead")]
        public async Task<MaintenanceRequest> CreateMaintenanceRequest(MaintenanceRequest request, [Service] IMaintenanceService maintenanceService) =>
            await maintenanceService.CreateAsync(request);

        [Obsolete("Use UpdateMaintenanceRequestWithDates instead")]
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

        public async Task<bool> DeleteMaintenanceRequest(Guid id, [Service] IMaintenanceService maintenanceService)
        {
            await maintenanceService.DeleteAsync(id);
            return true;
        }
    }
}
