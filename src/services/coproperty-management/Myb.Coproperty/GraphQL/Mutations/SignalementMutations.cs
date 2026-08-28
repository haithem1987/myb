using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;
using Myb.Coproperty.GraphQL.Types;
using System.Security.Claims;

namespace Myb.Coproperty.GraphQL.Mutations
{
    [ExtendObjectType("Mutation")]
    public class SignalementMutations
    {
        public async Task<Signalement> CreateSignalement(
            CreateSignalementInput input,
            ClaimsPrincipal? user,
            [Service] ISignalementService signalementService,
            [Service] IOwnerService ownerService,
            [Service] ICopropertyService copropertyService)
        {
            var authenticatedUserId = CopropertyAccessControl.GetUserId(user)
                ?? throw new InvalidOperationException("Authentification requise pour créer un signalement.");

            if (!Guid.TryParse(input.CopropertyId, out var copropertyId))
                throw new InvalidOperationException("La copropriété du signalement est invalide.");

            if (CopropertyAccessControl.IsOwner(user))
            {
                var owner = await ownerService.GetByUserIdAsync(authenticatedUserId)
                    ?? throw new InvalidOperationException("Profil propriétaire introuvable.");
                var isAssigned = owner.OwnerUnits.Any(link =>
                    link.EndDate == null &&
                    link.Unit != null &&
                    link.Unit.CopropertyId == copropertyId);

                if (!isAssigned)
                    throw new InvalidOperationException(
                        "Vous ne pouvez signaler un incident que dans une copropriété liée à l'un de vos lots actifs.");
            }
            else if (CopropertyAccessControl.IsSyndicOnly(user))
            {
                await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(
                    user, copropertyId, copropertyService);
            }

            // Never trust a caller-supplied reporter identity.
            input.ReportedBy = authenticatedUserId.ToString();
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
