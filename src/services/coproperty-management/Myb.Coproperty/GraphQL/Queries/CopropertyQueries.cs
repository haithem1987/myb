using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Models.Dtos;
using Myb.Coproperty.Services;
using System.Collections.Generic;

namespace Myb.Coproperty.GraphQL.Queries
{
    [ExtendObjectType("Query")]
    public class CopropertyQueries
    {
        public async Task<IEnumerable<Models.Coproperty>> GetCoproperties([Service] ICopropertyService copropertyService) =>
            await copropertyService.GetAllAsync();

        public async Task<Models.Coproperty> GetCopropertyById(Guid id, [Service] ICopropertyService copropertyService) =>
            await copropertyService.GetByIdAsync(id);

        public async Task<IEnumerable<Models.Coproperty>> GetCopropertiesByManager(Guid managerId, [Service] ICopropertyService copropertyService) =>
            await copropertyService.GetByManagerIdAsync(managerId);

        /// <summary>
        /// Get dashboard statistics for coproperties
        /// </summary>
        public async Task<DashboardStats> GetDashboardStats(
            [Service] IFinanceService financeService,
            Guid? copropertyId = null) =>
            await financeService.GetDashboardStatsAsync(copropertyId);

        /// <summary>
        /// Get treasury evolution data for the past N months
        /// </summary>
        public async Task<List<TreasuryDataPoint>> GetTreasuryEvolution(
            Guid copropertyId,
            [Service] IFinanceService financeService,
            int months = 12) =>
            await financeService.GetTreasuryEvolutionAsync(copropertyId, months);

        /// <summary>
        /// Get financial report for a specific year
        /// </summary>
        public async Task<FinancialReport> GetFinancialReport(
            Guid copropertyId,
            int year,
            [Service] IFinanceService financeService) =>
            await financeService.GenerateFinancialReportAsync(copropertyId, year);

        /// <summary>
        /// Get Keycloak users that hold the manager/syndic role.
        /// The role is created automatically if it does not yet exist.
        /// </summary>
        public async Task<IEnumerable<ManagerDto>> GetManagers(
            [Service] IKeycloakAdminService keycloakAdminService) =>
            await keycloakAdminService.GetManagersByRoleAsync();
    }
}
