using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Queries;

/// <summary>
/// GraphQL queries for fund call operations
/// </summary>
[ExtendObjectType("Query")]
public class FundCallQueries
{
    /// <summary>
    /// Get a fund call by ID
    /// </summary>
    public async Task<FundCall?> GetFundCall(
        Guid id,
        [Service] IFundCallService fundCallService) =>
        await fundCallService.GetByIdAsync(id);

    /// <summary>
    /// Get all fund calls for a coproperty
    /// </summary>
    public async Task<List<FundCall>> GetFundCallsByCoproperty(
        Guid copropertyId,
        [Service] IFundCallService fundCallService) =>
        await fundCallService.GetByCopropertyIdAsync(copropertyId);
}
