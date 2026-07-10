using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;

namespace Myb.Coproperty.GraphQL.Queries
{
    [ExtendObjectType("Query")]
    public class SignalementQueries
    {
        public async Task<IEnumerable<Signalement>> GetSignalements(
            Guid copropertyId,
            [Service] ISignalementService signalementService) =>
            await signalementService.GetByCopropertyIdAsync(copropertyId);

        public async Task<IEnumerable<Signalement>> GetSignalementsByStatus(
            Guid copropertyId,
            SignalementStatus status,
            [Service] ISignalementService signalementService) =>
            await signalementService.GetByStatusAsync(copropertyId, status);

        public async Task<IEnumerable<Signalement>> GetMySignalements(
            Guid userId,
            [Service] ISignalementService signalementService) =>
            await signalementService.GetByReporterAsync(userId);

        public async Task<Signalement?> GetSignalementById(
            Guid id,
            [Service] ISignalementService signalementService) =>
            await signalementService.GetByIdAsync(id);
    }
}
