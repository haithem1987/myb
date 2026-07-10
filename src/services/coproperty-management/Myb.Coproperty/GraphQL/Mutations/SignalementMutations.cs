using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;
using Myb.Coproperty.GraphQL.Types;

namespace Myb.Coproperty.GraphQL.Mutations
{
    [ExtendObjectType("Mutation")]
    public class SignalementMutations
    {
        public async Task<Signalement> CreateSignalement(
            CreateSignalementInput input,
            [Service] ISignalementService signalementService)
        {
            var entity = input.ToSignalement();
            return await signalementService.CreateAsync(entity);
        }

        public async Task<Signalement> UpdateSignalementStatus(
            string id,
            SignalementStatus status,
            string? syndicComment,
            [Service] ISignalementService signalementService)
        {
            if (!Guid.TryParse(id, out var guid))
                throw new ArgumentException($"Invalid signalement id: {id}");

            return await signalementService.UpdateStatusAsync(guid, status, syndicComment);
        }

        public async Task<bool> IncrementSignalementViews(
            string id,
            [Service] ISignalementService signalementService)
        {
            if (!Guid.TryParse(id, out var guid))
                throw new ArgumentException($"Invalid signalement id: {id}");

            await signalementService.IncrementViewsAsync(guid);
            return true;
        }

        public async Task<bool> DeleteSignalement(
            string id,
            [Service] ISignalementService signalementService)
        {
            if (!Guid.TryParse(id, out var guid))
                throw new ArgumentException($"Invalid signalement id: {id}");

            await signalementService.DeleteAsync(guid);
            return true;
        }
    }
}
