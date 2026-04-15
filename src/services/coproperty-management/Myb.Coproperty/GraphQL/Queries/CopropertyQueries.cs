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
        /// Get full treasury dashboard (real + accounting treasury)
        /// </summary>
        public async Task<TreasuryDashboard> GetTreasuryDashboard(
            Guid copropertyId,
            [Service] IFinanceService financeService,
            int months = 12) =>
            await financeService.GetTreasuryDashboardAsync(copropertyId, months);

        /// <summary>
        /// Get unpaid/late payment summary for a coproperty
        /// </summary>
        public async Task<UnpaidPaymentsSummary> GetUnpaidPaymentsSummary(
            Guid copropertyId,
            [Service] IFinanceService financeService) =>
            await financeService.GetUnpaidPaymentsSummaryAsync(copropertyId);

        /// <summary>
        /// Get payment summary for a specific owner
        /// </summary>
        public async Task<OwnerPaymentSummary> GetOwnerPaymentSummary(
            Guid ownerId,
            [Service] IFinanceService financeService,
            Guid? copropertyId = null) =>
            await financeService.GetOwnerPaymentSummaryAsync(ownerId, copropertyId);

        /// <summary>
        /// Get Keycloak users that hold the manager/syndic role.
        /// The role is created automatically if it does not yet exist.
        /// </summary>
        public async Task<IEnumerable<ManagerDto>> GetManagers(
            [Service] IKeycloakAdminService keycloakAdminService) =>
            await keycloakAdminService.GetManagersByRoleAsync();

        /// <summary>
        /// Search Keycloak users by partial email match (uses backend service account).
        /// </summary>
        public async Task<IEnumerable<KeycloakUserSearchDto>> SearchKeycloakUsers(
            string email,
            int? max,
            [Service] IKeycloakAdminService keycloakAdminService) =>
            await keycloakAdminService.SearchUsersByEmailAsync(email, max ?? 20);

        /// <summary>
        /// Get client roles assigned to a Keycloak user (uses backend service account).
        /// </summary>
        public async Task<IEnumerable<string>> GetUserClientRoles(
            string userId,
            [Service] IKeycloakAdminService keycloakAdminService) =>
            await keycloakAdminService.GetUserClientRolesAsync(userId);
    }
}
