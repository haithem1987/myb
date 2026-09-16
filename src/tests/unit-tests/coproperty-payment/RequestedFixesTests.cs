using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Moq;
using Myb.Coproperty.GraphQL.Mutations;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;
using Xunit;

namespace Myb.Coproperty.Payment.Tests;

public class RequestedFixesTests
{
    [Theory]
    [InlineData(-1)]
    [InlineData(0)]
    public async Task TenantDates_RejectInvalidOrderBeforeWriting(int days)
    {
        var service = new TenantService(Mock.Of<ITenantRepository>(), Mock.Of<IUnitRepository>());
        var tenant = new Tenant { LeaseStartDate = DateTime.UtcNow };
        tenant.LeaseEndDate = tenant.LeaseStartDate.AddDays(days);
        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(tenant));
        await Assert.ThrowsAsync<ArgumentException>(() => service.UpdateAsync(tenant));
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(0)]
    public async Task BudgetDates_RejectInvalidOrderBeforeWriting(int days)
    {
        var service = new ChargeService(null!, null!, null!, null!, null!, null!);
        var charge = new Charge { StartDate = DateTime.UtcNow };
        charge.EndDate = charge.StartDate.AddDays(days);
        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(charge));
        await Assert.ThrowsAsync<ArgumentException>(() => service.UpdateAsync(charge));
    }

    [Fact]
    public async Task PhoneUpdate_OnlyChangesAuthenticatedOwner()
    {
        var factory = new Factory();
        var userId = Guid.NewGuid();
        var otherId = Guid.NewGuid();
        await using (var context = factory.CreateDbContext())
        {
            context.Owners.AddRange(
                new Owner { Id = Guid.NewGuid(), UserId = userId, Phone = "111" },
                new Owner { Id = Guid.NewGuid(), UserId = otherId, Phone = "222" });
            await context.SaveChangesAsync();
        }
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
            new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) }, "test"));
        await new OwnerMutations().UpdateMyOwnerPhone(" +216 12345678 ", principal, factory);
        await using var verify = factory.CreateDbContext();
        Assert.Equal("+216 12345678", (await verify.Owners.SingleAsync(o => o.UserId == userId)).Phone);
        Assert.Equal("222", (await verify.Owners.SingleAsync(o => o.UserId == otherId)).Phone);
    }

    [Fact]
    public async Task PhoneUpdate_RejectsAnonymousUser()
    {
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            new OwnerMutations().UpdateMyOwnerPhone("123", new ClaimsPrincipal(), new Factory()));
    }

    [Fact]
    public async Task OwnerProfileUpdate_SynchronizesLiveOwnerWithoutChangingHistoricalSnapshot()
    {
        var factory = new Factory();
        var userId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var copropertyId = Guid.NewGuid();
        await using (var context = factory.CreateDbContext())
        {
            context.Coproperties.Add(new global::Myb.Coproperty.Models.Coproperty
                { Id = copropertyId, Name = "Managed", IsActive = true });
            context.Owners.Add(new Owner
                { Id = ownerId, UserId = userId, FirstName = "Old", LastName = "Name", Email = "old@example.com" });
            context.FundCalls.Add(new FundCall
            {
                Id = Guid.NewGuid(), CopropertyId = copropertyId, OwnerId = ownerId,
                OwnerNameSnapshot = "Old Name", Amount = 100, Description = "Historical",
                DueDate = DateTime.UtcNow.AddDays(30)
            });
            await context.SaveChangesAsync();
        }

        var principal = new ClaimsPrincipal(new ClaimsIdentity(
            new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) }, "test"));
        await new OwnerMutations().UpdateMyOwnerProfile(
            "New", "Name", "new@example.com", "+216 555", principal, factory);

        await using var verify = factory.CreateDbContext();
        var owner = await verify.Owners.SingleAsync(o => o.UserId == userId);
        Assert.Equal("New", owner.FirstName);
        Assert.Equal("Name", owner.LastName);
        Assert.Equal("new@example.com", owner.Email);
        Assert.Equal("+216 555", owner.Phone);
        Assert.Equal("Old Name", (await verify.FundCalls.SingleAsync()).OwnerNameSnapshot);
    }

    [Fact]
    public async Task SyndicSearch_OnlyReturnsRelatedUsers()
    {
        var factory = new Factory();
        var syndicId = Guid.NewGuid();
        var residentId = Guid.NewGuid();
        var copropertyId = Guid.NewGuid();
        await using (var context = factory.CreateDbContext())
        {
            var coproperty = new global::Myb.Coproperty.Models.Coproperty { Id = copropertyId, Name = "Managed", IsActive = true };
            var owner = new Owner { Id = Guid.NewGuid(), UserId = residentId, Email = "related@example.com" };
            var unit = new Unit { Id = Guid.NewGuid(), CopropertyId = copropertyId, UnitNumber = "A1" };
            context.Coproperties.Add(coproperty);
            context.Owners.Add(owner);
            context.Units.Add(unit);
            context.OwnerUnits.Add(new OwnerUnit { OwnerId = owner.Id, UnitId = unit.Id });
            await context.SaveChangesAsync();
        }
        var directory = new Mock<IKeycloakAdminService>();
        directory.Setup(x => x.SearchUsersByEmailAsync("example", 20)).ReturnsAsync(new[] {
            new Myb.Coproperty.Models.Dtos.KeycloakUserSearchDto(residentId.ToString(), "related@example.com", "Related", "Owner", null, true, true, new()),
            new Myb.Coproperty.Models.Dtos.KeycloakUserSearchDto(Guid.NewGuid().ToString(), "unrelated@example.com", "Other", "Owner", null, true, true, new())
        });
        var coproperties = new Mock<ICopropertyService>();
        coproperties.Setup(x => x.GetAllAsync(syndicId)).ReturnsAsync(new[] {
            new global::Myb.Coproperty.Models.Coproperty { Id = copropertyId }
        });
        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[] {
            new Claim(ClaimTypes.NameIdentifier, syndicId.ToString()),
            new Claim(ClaimTypes.Role, CopropertyAccessControl.SyndicRole)
        }, "test"));
        var results = await new Myb.Coproperty.GraphQL.Queries.CopropertyQueries().SearchKeycloakUsers(
            "example", 20, principal, directory.Object, coproperties.Object, factory);
        Assert.Equal(residentId.ToString(), Assert.Single(results).Id);
    }

    [Fact]
    public async Task AddOwnerSearch_ReturnsExistingOwnerAndHydratesRegisteredPhone()
    {
        var factory = new Factory();
        var syndicId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();
        await using (var context = factory.CreateDbContext())
        {
            context.Owners.Add(new Owner
            {
                Id = Guid.NewGuid(), UserId = ownerUserId, Email = "fatma@example.com",
                FirstName = "Fatma", LastName = "Tu", Phone = "+21653867777"
            });
            await context.SaveChangesAsync();
        }
        var directory = new Mock<IKeycloakAdminService>();
        directory.Setup(x => x.SearchUsersByEmailAsync("Fatma", 20)).ReturnsAsync(new[]
        {
            new Myb.Coproperty.Models.Dtos.KeycloakUserSearchDto(
                ownerUserId.ToString(), "fatma@example.com", "Fatma", "Tu", null, true, true, new())
        });
        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, syndicId.ToString()),
            new Claim(ClaimTypes.Role, CopropertyAccessControl.SyndicRole)
        }, "test"));

        var results = await new Myb.Coproperty.GraphQL.Queries.CopropertyQueries().SearchOwnerCandidates(
            "Fatma", 20, principal, directory.Object, factory);

        var candidate = Assert.Single(results);
        Assert.Equal(ownerUserId.ToString(), candidate.Id);
        Assert.Equal("+21653867777", candidate.Phone);
    }

    private sealed class Factory : IDbContextFactory<CopropertyDbContext>
    {
        private readonly DbContextOptions<CopropertyDbContext> options =
            new DbContextOptionsBuilder<CopropertyDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        public CopropertyDbContext CreateDbContext() => new(options);
    }
}
