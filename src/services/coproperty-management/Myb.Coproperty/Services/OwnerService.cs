using Myb.Common.Messaging;
using Myb.Common.Messaging.Models;
using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.Services
{
    public class OwnerService : IOwnerService
    {
        private readonly IOwnerRepository _ownerRepository;
        private readonly IEmailPublisher _emailPublisher;

        public OwnerService(IOwnerRepository ownerRepository, IEmailPublisher emailPublisher)
        {
            _ownerRepository = ownerRepository;
            _emailPublisher = emailPublisher;
        }

        public async Task<Owner> CreateAsync(Owner owner)
        {
            var result = await _ownerRepository.InsertAsync(owner);
            
            if (result.Errors != null && result.Errors.Any())
            {
                throw new InvalidOperationException($"Failed to create owner: {string.Join(", ", result.Errors)}");
            }
            
            if (result.Entity == null)
            {
                throw new InvalidOperationException("Failed to create owner: Entity was not returned");
            }

            var created = result.Entity;

            if (!string.IsNullOrWhiteSpace(created.Email))
            {
                await _emailPublisher.PublishAsync(new EmailMessage
                {
                    To = created.Email,
                    Subject = "Bienvenue sur MYB – Votre compte propriétaire a été créé",
                    HtmlBody = $"""
                        <html><body style="font-family:Arial,sans-serif;color:#333">
                          <h2 style="color:#2c5282">Bienvenue sur MYB, {created.FirstName} !</h2>
                          <p>Votre compte propriétaire a été créé avec succès.</p>
                          <p>Vous pouvez dès maintenant accéder à votre espace pour consulter vos charges, appels de fonds et informations de copropriété.</p>
                          <hr/>
                          <p style="font-size:12px;color:#888">MYB – Gestion de copropriété</p>
                        </body></html>
                        """
                });
            }

            return created;
        }

        public async Task DeleteAsync(Guid id)
        {
            await _ownerRepository.DeleteAsync(id);
        }

        public async Task<Owner> GetByIdAsync(Guid id)
        {
            var owner = await _ownerRepository.GetByIdWithUnitsAsync(id);
            if (owner == null)
            {
                throw new InvalidOperationException($"Owner with ID {id} not found");
            }
            return owner;
        }

        public async Task<Owner?> GetByUserIdAsync(Guid userId)
        {
            return await _ownerRepository.GetByUserIdAsync(userId);
        }

        public async Task<IEnumerable<Owner>> GetByCopropertyIdAsync(Guid copropertyId)
        {
            return await _ownerRepository.GetByCopropertyIdAsync(copropertyId);
        }

        public async Task<IEnumerable<Owner>> GetByUnitIdAsync(Guid unitId)
        {
            return await _ownerRepository.GetByUnitIdAsync(unitId);
        }

        public async Task UpdateAsync(Owner owner)
        {
            await _ownerRepository.UpdateAsync(owner);
        }
    }
}
