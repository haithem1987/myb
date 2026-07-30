using HotChocolate;
using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;
using Myb.Coproperty.GraphQL.Types;
using Myb.Coproperty.Infrastructure.Repositories;

namespace Myb.Coproperty.GraphQL.Mutations
{
    [ExtendObjectType("Mutation")]
    public class OwnerMutations
    {
        /// <summary>
        /// Create owner with multiple units (recommended)
        /// </summary>
        public async Task<Owner> CreateOwnerWithUnits(
            CreateOwnerWithUnitsInput input, 
            [Service] IOwnerService ownerService,
            [Service] IOwnerUnitRepository ownerUnitRepository,
            [Service] IDbContextFactory<CopropertyDbContext> contextFactory,
            [Service] IKeycloakAdminService keycloakAdminService,
            [Service] ILogger<OwnerMutations> logger)
        {
            await using var lookupContext = await contextFactory.CreateDbContextAsync();
            var existingOwner = await lookupContext.Owners
                .Where(o => o.UserId == input.UserId)
                .OrderBy(o => o.CreatedAt)
                .FirstOrDefaultAsync();

            await EnsureUnitsAreAvailable(
                input.Units.Select(u => u.UnitId),
                existingOwner?.Id,
                contextFactory);

            Owner createdOwner;
            if (existingOwner == null)
            {
                var owner = new Owner
                {
                    Id = input.Id == Guid.Empty ? Guid.NewGuid() : input.Id,
                    UserId = input.UserId,
                    FirstName = input.FirstName,
                    LastName = input.LastName,
                    Email = input.Email,
                    Phone = input.Phone,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                createdOwner = await ownerService.CreateAsync(owner);
            }
            else
            {
                existingOwner.FirstName = input.FirstName;
                existingOwner.LastName = input.LastName;
                existingOwner.Email = input.Email;
                existingOwner.Phone = input.Phone;
                existingOwner.UpdatedAt = DateTime.UtcNow;
                await ownerService.UpdateAsync(existingOwner);
                createdOwner = existingOwner;
            }

            var activeUnitIds = (await ownerUnitRepository.GetByOwnerIdAsync(createdOwner.Id))
                .Where(link => link.EndDate == null)
                .Select(link => link.UnitId)
                .ToHashSet();

            // The mutation is idempotent: retrying the same assignment returns the
            // existing owner and creates only unit links that do not already exist.
            foreach (var unitInput in input.Units.Where(unit => !activeUnitIds.Contains(unit.UnitId)))
            {
                var ownerUnit = new OwnerUnit
                {
                    Id = Guid.NewGuid(),
                    OwnerId = createdOwner.Id,
                    UnitId = unitInput.UnitId,
                    OwnershipPercentage = unitInput.OwnershipPercentage,
                    StartDate = unitInput.StartDate,
                    EndDate = unitInput.EndDate,
                    IsMainOwner = unitInput.IsMainOwner,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                
                await ownerUnitRepository.InsertAsync(ownerUnit);
            }

            // Assign the coproperty-owner Keycloak role so the user can access the owner portal
            try
            {
                var assigned = await keycloakAdminService.AssignClientRoleAsync(
                    input.UserId.ToString(), "coproperty-owner");
                if (!assigned)
                    logger.LogWarning("Could not assign coproperty-owner role to user {UserId}", input.UserId);
            }
            catch (Exception ex)
            {
                // Role assignment failure is non-fatal — owner record is already created
                logger.LogError(ex, "Failed to assign coproperty-owner role to user {UserId}", input.UserId);
            }
            
            return createdOwner;
        }
        
        /// <summary>
        /// Update owner with multiple units
        /// </summary>
        public async Task<Owner> UpdateOwnerWithUnits(
            Guid id,
            CreateOwnerWithUnitsInput input,
            [Service] IOwnerService ownerService,
            [Service] IOwnerUnitRepository ownerUnitRepository,
            [Service] IDbContextFactory<CopropertyDbContext> contextFactory)
        {
            await EnsureUnitsAreAvailable(input.Units.Select(u => u.UnitId), id, contextFactory);

            var owner = await ownerService.GetByIdAsync(id);
            var existingOwnerUnits = (await ownerUnitRepository.GetByOwnerIdAsync(id))
                .Where(ou => ou.EndDate == null)
                .ToList();
            var existingUnitIds = existingOwnerUnits.Select(ou => ou.UnitId).OrderBy(x => x).ToArray();
            var requestedUnitIds = input.Units.Select(u => u.UnitId).Distinct().OrderBy(x => x).ToArray();

            if (!existingUnitIds.SequenceEqual(requestedUnitIds))
            {
                throw new InvalidOperationException(
                    "Les lots d'un propriétaire ne peuvent pas être remplacés depuis la modification standard. Utilisez l'action « Changer de propriétaire ».");
            }

            // Update profile fields only after assignment validation succeeds.
            owner.FirstName = input.FirstName;
            owner.LastName = input.LastName;
            owner.Email = input.Email;
            owner.Phone = input.Phone;
            owner.UpdatedAt = DateTime.UtcNow;
            await ownerService.UpdateAsync(owner);
            
            return owner;
        }

        /// <summary>
        /// Transfers a unit to another existing owner while preserving the previous
        /// OwnerUnit row as ownership history.
        /// </summary>
        public async Task<OwnerUnit> ChangeUnitOwner(
            Guid unitId,
            Guid newOwnerId,
            [Service] IDbContextFactory<CopropertyDbContext> contextFactory)
        {
            await using var context = contextFactory.CreateDbContext();
            await using var transaction = await context.Database.BeginTransactionAsync();

            var unit = await context.Units.FindAsync(unitId)
                ?? throw new InvalidOperationException($"Unit with ID {unitId} not found");
            var newOwner = await context.Owners.FindAsync(newOwnerId)
                ?? throw new InvalidOperationException($"Owner with ID {newOwnerId} not found");

            var current = await context.OwnerUnits
                .SingleOrDefaultAsync(ou => ou.UnitId == unitId && ou.EndDate == null);

            if (current == null)
                throw new InvalidOperationException("Ce lot n'a aucun propriétaire actif.");
            if (current.OwnerId == newOwnerId)
                throw new InvalidOperationException("Ce propriétaire est déjà affecté à ce lot.");

            var changedAt = DateTime.UtcNow;
            current.EndDate = changedAt;
            current.UpdatedAt = changedAt;

            var replacement = new OwnerUnit
            {
                Id = Guid.NewGuid(),
                OwnerId = newOwner.Id,
                UnitId = unit.Id,
                OwnershipPercentage = 100m,
                StartDate = changedAt,
                EndDate = null,
                IsMainOwner = true,
                CreatedAt = changedAt,
                UpdatedAt = changedAt
            };
            context.OwnerUnits.Add(replacement);

            await context.SaveChangesAsync();
            await transaction.CommitAsync();
            return replacement;
        }

        private static async Task EnsureUnitsAreAvailable(
            IEnumerable<Guid> unitIds,
            Guid? currentOwnerId,
            IDbContextFactory<CopropertyDbContext> contextFactory)
        {
            var ids = unitIds.Distinct().ToArray();
            await using var context = contextFactory.CreateDbContext();
            var conflicts = await context.OwnerUnits
                .Include(ou => ou.Owner)
                .Include(ou => ou.Unit)
                .Where(ou => ids.Contains(ou.UnitId) &&
                    ou.EndDate == null &&
                    (!currentOwnerId.HasValue || ou.OwnerId != currentOwnerId.Value))
                .Select(ou => new { ou.Unit.UnitNumber, ou.Owner.FirstName, ou.Owner.LastName })
                .ToListAsync();

            if (conflicts.Count > 0)
            {
                var details = string.Join(", ", conflicts.Select(c =>
                    $"{c.UnitNumber} ({c.FirstName} {c.LastName})"));
                throw new InvalidOperationException(
                    $"Lot(s) déjà affecté(s) : {details}. Utilisez l'action « Changer de propriétaire ».");
            }
        }

        /// <summary>
        /// Legacy: Add owner (deprecated - use CreateOwnerWithUnits instead)
        /// </summary>
        [Obsolete("Use CreateOwnerWithUnits instead")]
        public async Task<Owner> AddOwner(Owner owner, [Service] IOwnerService ownerService) =>
            await ownerService.CreateAsync(owner);

        public async Task<bool> RemoveOwner(Guid id, [Service] IOwnerService ownerService)
        {
            await ownerService.DeleteAsync(id);
            return true;
        }
    }
}
