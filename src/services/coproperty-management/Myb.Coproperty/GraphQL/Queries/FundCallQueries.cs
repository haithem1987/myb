using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Models.Dtos;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Queries;

/// <summary>
/// GraphQL queries for fund call operations
/// </summary>
[ExtendObjectType("Query")]
public class FundCallQueries
{
    /// <summary>Get a fund call by ID</summary>
    public async Task<FundCall?> GetFundCall(
        Guid id,
        [Service] IFundCallService fundCallService) =>
        await fundCallService.GetByIdAsync(id);

    /// <summary>
    /// Get all fund calls for a coproperty, optionally filtered by owner and/or year.
    /// </summary>
    public async Task<List<FundCall>> GetFundCallsByCoproperty(
        Guid copropertyId,
        Guid? ownerId,
        int? year,
        [Service] IFundCallService fundCallService) =>
        await fundCallService.GetByCopropertyIdAsync(copropertyId, ownerId, year);

    /// <summary>
    /// Get all fund calls across all coproperties (unfiltered; filtering handled client-side).
    /// </summary>
    public async Task<List<FundCall>> GetAllFundCalls(
        [Service] IFundCallService fundCallService) =>
        await fundCallService.GetAllAsync();

    /// <summary>
    /// Get all fund calls for a specific owner (across all coproperties).
    /// Used by the owner portal.
    /// </summary>
    public async Task<List<FundCall>> GetFundCallsByOwner(
        Guid ownerId,
        [Service] IFundCallService fundCallService) =>
        await fundCallService.GetByOwnerIdAsync(ownerId);

    /// <summary>
    /// Get all fund call payments for a specific owner (by Keycloak user ID).
    /// Used by the owner receipt page ("Mes Reçus").
    /// </summary>
    public async Task<List<FundCallPayment>> GetFundCallPaymentsByOwner(
        Guid ownerUserId,
        [Service] IFundCallService fundCallService) =>
        await fundCallService.GetPaymentsByOwnerUserIdAsync(ownerUserId);

    /// <summary>
    /// Get remaining fund call totals per owner for a coproperty.
    /// Used during repartition to avoid double-charging owners who already have fund calls.
    /// </summary>
    public async Task<List<OwnerFundCallTotal>> GetExistingFundCallTotals(
        Guid copropertyId,
        [Service] IFundCallService fundCallService)
    {
        var totals = await fundCallService.GetExistingFundCallTotalsByOwnerAsync(copropertyId);
        return totals.Select(kvp => new OwnerFundCallTotal
        {
            OwnerId = kvp.Key,
            RemainingAmount = kvp.Value
        }).ToList();
    }
}
