using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Models.Dtos;
using Myb.Coproperty.Services;
using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Infrastructure.Data;
using System.Collections.Generic;
using System.Security.Claims;

namespace Myb.Coproperty.GraphQL.Queries
{
    [ExtendObjectType("Query")]
    public class CopropertyQueries
    {
        public async Task<IEnumerable<Models.Coproperty>> GetCoproperties(
            ClaimsPrincipal? user,
            [Service] ICopropertyService copropertyService,
            Guid? managerId = null) =>
            await copropertyService.GetAllAsync(CopropertyAccessControl.ResolveEffectiveManagerId(user, managerId));

        /// <summary>
        /// Return all syndic sidebar counts in one request. Keeping this aggregation
        /// server-side avoids issuing one GraphQL request per coproperty and menu item.
        /// </summary>
        public async Task<SyndicMenuCounts> GetSyndicMenuCounts(
            ClaimsPrincipal? user,
            [Service] ICopropertyService copropertyService,
            [Service] IDbContextFactory<CopropertyDbContext> contextFactory)
        {
            if (!CopropertyAccessControl.IsSyndicOnly(user) &&
                !CopropertyAccessControl.IsAdmin(user))
                throw new InvalidOperationException(
                    "Accès refusé : seuls les syndics et administrateurs peuvent consulter ces statistiques.");

            var scopedIds = await CopropertyAccessControl.GetScopedCopropertyIdsAsync(user, copropertyService);
            await using var context = await contextFactory.CreateDbContextAsync();

            var coproperties = context.Coproperties.AsNoTracking();
            var charges = context.Charges.AsNoTracking();
            var units = context.Units.AsNoTracking();
            var owners = context.Owners.AsNoTracking();
            var tenants = context.Tenants.AsNoTracking();
            var fundCalls = context.FundCalls.AsNoTracking();
            var interventions = context.Interventions.AsNoTracking();
            var signalements = context.Signalements.AsNoTracking();
            var discussions = context.Discussions.AsNoTracking();

            if (scopedIds != null)
            {
                coproperties = coproperties.Where(item => scopedIds.Contains(item.Id));
                charges = charges.Where(item => scopedIds.Contains(item.CopropertyId));
                units = units.Where(item => scopedIds.Contains(item.CopropertyId));
                owners = owners.Where(item => item.OwnerUnits.Any(link =>
                    link.EndDate == null && scopedIds.Contains(link.Unit.CopropertyId)));
                tenants = tenants.Where(item => scopedIds.Contains(item.Unit.CopropertyId));
                fundCalls = fundCalls.Where(item => scopedIds.Contains(item.CopropertyId));
                interventions = interventions.Where(item => scopedIds.Contains(item.CopropertyId));
                signalements = signalements.Where(item => scopedIds.Contains(item.CopropertyId));
                discussions = discussions.Where(item => scopedIds.Contains(item.CopropertyId));
            }

            return new SyndicMenuCounts
            {
                Coproperties = await coproperties.CountAsync(),
                Budgets = await charges.CountAsync(),
                Units = await units.CountAsync(),
                Owners = await owners.CountAsync(),
                Tenants = await tenants.CountAsync(),
                FundCalls = await fundCalls.CountAsync(),
                ChargePayments = await charges.CountAsync(item => item.Distributions.Any()),
                Interventions = await interventions.CountAsync(),
                Signalements = await signalements.CountAsync(),
                Discussions = await discussions.CountAsync()
            };
        }

        public async Task<Models.Coproperty> GetCopropertyById(
            Guid id,
            ClaimsPrincipal? user,
            [Service] ICopropertyService copropertyService)
        {
            var coproperty = await copropertyService.GetByIdAsync(id);
            if (coproperty != null)
                CopropertyAccessControl.EnsureOwnership(user, coproperty.ManagerId);

            return coproperty;
        }

        public async Task<IEnumerable<Models.Coproperty>> GetCopropertiesByManager(
            Guid managerId,
            ClaimsPrincipal? user,
            [Service] ICopropertyService copropertyService)
        {
            var effectiveManagerId = CopropertyAccessControl.ResolveEffectiveManagerId(user, managerId)
                ?? managerId;
            return await copropertyService.GetByManagerIdAsync(effectiveManagerId);
        }

        /// <summary>
        /// Get a coproperty by name (for duplicate name checking)
        /// </summary>
        public async Task<Models.Coproperty?> GetCopropertyByName(
            string name,
            Guid? managerId,
            Guid? excludeId,
            ClaimsPrincipal? user,
            [Service] ICopropertyService copropertyService)
        {
            var effectiveManagerId = CopropertyAccessControl.ResolveEffectiveManagerId(user, managerId);
            return await copropertyService.GetByNameAsync(name, effectiveManagerId, excludeId);
        }

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
