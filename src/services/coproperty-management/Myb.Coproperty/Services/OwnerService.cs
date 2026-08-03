using Microsoft.Extensions.Options;
using Myb.Common.Messaging;
using Myb.Common.Messaging.Models;
using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Models;
using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Infrastructure.Data;

namespace Myb.Coproperty.Services
{
    public class OwnerService : IOwnerService
    {
        private readonly IOwnerRepository _ownerRepository;
        private readonly IEmailPublisher _emailPublisher;
        private readonly KeycloakOptions _keycloakOptions;
        private readonly IDbContextFactory<CopropertyDbContext> _contextFactory;

        public OwnerService(
            IOwnerRepository ownerRepository,
            IEmailPublisher emailPublisher,
            IOptions<KeycloakOptions> keycloakOptions,
            IDbContextFactory<CopropertyDbContext> contextFactory)
        {
            _ownerRepository = ownerRepository;
            _emailPublisher = emailPublisher;
            _keycloakOptions = keycloakOptions.Value;
            _contextFactory = contextFactory;
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
                var portalUrl = _keycloakOptions.OwnerPortalUrl;
                await _emailPublisher.PublishAsync(new EmailMessage
                {
                    To = created.Email,
                    Subject = "Bienvenue sur MYB – Votre rôle propriétaire a été assigné",
                    HtmlBody = $"""
                        <html><body style="font-family:Arial,sans-serif;color:#333">
                          <h2 style="color:#2c5282">Bienvenue sur MYB, {created.FirstName} !</h2>
                          <p>Votre compte propriétaire a été créé avec succès et le rôle <strong>propriétaire</strong> vous a été assigné.</p>
                          <p>Vous pouvez dès maintenant accéder à votre espace propriétaire pour consulter vos charges, appels de fonds et informations de copropriété.</p>
                          <p style="margin:24px 0">
                            <a href="{portalUrl}" style="background:#2c5282;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Accéder à mon espace propriétaire</a>
                          </p>
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
            await using var context = await _contextFactory.CreateDbContextAsync();
            var owner = await context.Owners
                .Include(o => o.OwnerUnits)
                .SingleOrDefaultAsync(o => o.Id == id);
            if (owner == null)
                throw new InvalidOperationException($"Owner with ID {id} not found");

            var deletedAt = DateTime.UtcNow;
            owner.IsDeleted = true;
            owner.DeletedAt = deletedAt;
            owner.UpdatedAt = deletedAt;
            foreach (var link in owner.OwnerUnits.Where(link => link.EndDate == null))
            {
                link.EndDate = deletedAt;
                link.UpdatedAt = deletedAt;
            }

            await context.SaveChangesAsync();
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
