using HotChocolate;
using HotChocolate.Types;
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
            [Service] IOwnerUnitRepository ownerUnitRepository)
        {
            // Create the owner first
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
            
            var createdOwner = await ownerService.CreateAsync(owner);
            
            // Create OwnerUnit associations
            foreach (var unitInput in input.Units)
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
            
            return createdOwner;
        }
        
        /// <summary>
        /// Update owner with multiple units
        /// </summary>
        public async Task<Owner> UpdateOwnerWithUnits(
            Guid id,
            CreateOwnerWithUnitsInput input,
            [Service] IOwnerService ownerService,
            [Service] IOwnerUnitRepository ownerUnitRepository)
        {
            // Update the owner
            var owner = await ownerService.GetByIdAsync(id);
            owner.FirstName = input.FirstName;
            owner.LastName = input.LastName;
            owner.Email = input.Email;
            owner.Phone = input.Phone;
            owner.UpdatedAt = DateTime.UtcNow;
            
            await ownerService.UpdateAsync(owner);
            
            // Remove existing OwnerUnit associations
            var existingOwnerUnits = await ownerUnitRepository.GetByOwnerIdAsync(id);
            foreach (var existingOwnerUnit in existingOwnerUnits)
            {
                await ownerUnitRepository.DeleteAsync(existingOwnerUnit.Id);
            }
            
            // Create new OwnerUnit associations
            foreach (var unitInput in input.Units)
            {
                var ownerUnit = new OwnerUnit
                {
                    Id = Guid.NewGuid(),
                    OwnerId = id,
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
            
            return owner;
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
