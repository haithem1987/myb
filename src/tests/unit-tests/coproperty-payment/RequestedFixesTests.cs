using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
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
            context.CopropertyInvoices.Add(new CopropertyInvoice
            {
                Id = Guid.NewGuid(), CopropertyId = copropertyId, OwnerId = ownerId,
                OwnerNameSnapshot = "Old Name", InvoiceNumber = "HISTORY-1",
                InvoiceDate = DateTime.UtcNow, DueDate = DateTime.UtcNow.AddDays(30)
            });
            await context.SaveChangesAsync();
        }

        var principal = new ClaimsPrincipal(new ClaimsIdentity(
            new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) }, "test"));
        Assert.True(await new OwnerMutations().SynchronizeMyOwnerProfile(
            "New", "Name", "new@example.com", "+216 555", principal, factory));

        await using var verify = factory.CreateDbContext();
        var owner = await verify.Owners.SingleAsync(o => o.UserId == userId);
        Assert.Equal("New", owner.FirstName);
        Assert.Equal("Name", owner.LastName);
        Assert.Equal("new@example.com", owner.Email);
        Assert.Equal("+216 555", owner.Phone);
        Assert.Equal("Old Name", (await verify.FundCalls.SingleAsync()).OwnerNameSnapshot);
        Assert.Equal("Old Name", (await verify.CopropertyInvoices.SingleAsync()).OwnerNameSnapshot);
    }

    [Fact]
    public async Task EditingExistingFundCall_DoesNotRewriteHistoricalOwnerName()
    {
        var factory = new Factory();
        var ownerId = Guid.NewGuid();
        var copropertyId = Guid.NewGuid();
        var fundCallId = Guid.NewGuid();
        await using (var context = factory.CreateDbContext())
        {
            context.Coproperties.Add(new global::Myb.Coproperty.Models.Coproperty
                { Id = copropertyId, Name = "Managed", IsActive = true });
            context.Owners.Add(new Owner
                { Id = ownerId, UserId = Guid.NewGuid(), FirstName = "Current", LastName = "Name" });
            context.FundCalls.Add(new FundCall
            {
                Id = fundCallId, CopropertyId = copropertyId, OwnerId = ownerId,
                OwnerNameSnapshot = "Historical Name", Amount = 100,
                Description = "Original", DueDate = DateTime.UtcNow.AddDays(30),
                Status = FundCallStatus.ToPay, IsActive = true
            });
            await context.SaveChangesAsync();
        }

        var service = new FundCallService(
            factory, Mock.Of<Myb.Common.Messaging.IEmailPublisher>(),
            Mock.Of<IHttpClientFactory>(), Mock.Of<IKeycloakAdminService>(),
            Mock.Of<IConfiguration>());
        await service.UpdateAsync(fundCallId, new Myb.Coproperty.Models.Dtos.CreateFundCallInput
        {
            CopropertyId = copropertyId,
            OwnerId = ownerId,
            Amount = 100,
            Description = "Edited without reassignment",
            DueDate = DateTime.UtcNow.AddDays(31),
            Status = FundCallStatus.ToPay
        }, Guid.NewGuid().ToString());

        await using var verify = factory.CreateDbContext();
        Assert.Equal("Historical Name",
            (await verify.FundCalls.SingleAsync(fundCall => fundCall.Id == fundCallId)).OwnerNameSnapshot);
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

    [Theory]
    [InlineData("en", "Unit assignment confirmed", "You are now registered")]
    [InlineData("fr", "Confirmation d'affectation d'un lot", "Vous êtes désormais enregistré")]
    public async Task OwnershipEmail_UsesRecipientsPreferredLanguage(
        string language, string expectedSubject, string expectedBody)
    {
        var previousOwner = new Owner
        {
            Id = Guid.NewGuid(), UserId = Guid.NewGuid(), Email = "old@example.com", FirstName = "Old"
        };
        var newOwner = new Owner
        {
            Id = Guid.NewGuid(), UserId = Guid.NewGuid(), Email = "new@example.com", FirstName = "New"
        };
        var directory = new Mock<IKeycloakAdminService>();
        directory.Setup(service => service.GetPreferredLanguageAsync(It.IsAny<string>())).ReturnsAsync(language);
        var mail = new Mock<Myb.Common.Messaging.IEmailPublisher>();
        var httpFactory = new Mock<IHttpClientFactory>();
        httpFactory.Setup(factory => factory.CreateClient("NotificationService"))
            .Returns(new HttpClient(new SuccessHandler()) { BaseAddress = new Uri("http://localhost") });
        var service = new OwnershipNotificationService(
            mail.Object, httpFactory.Object,
            Mock.Of<ILogger<OwnershipNotificationService>>(), directory.Object);

        await service.NotifyOwnershipChangedAsync(previousOwner, newOwner, new Unit
        {
            Id = Guid.NewGuid(), UnitNumber = "A1", CopropertyId = Guid.NewGuid(),
            Coproperty = new global::Myb.Coproperty.Models.Coproperty { Name = "Residence" }
        });

        mail.Verify(publisher => publisher.PublishAsync(It.Is<Myb.Common.Messaging.Models.EmailMessage>(message =>
            message.To == newOwner.Email && message.Subject == expectedSubject &&
            message.HtmlBody.Contains(System.Net.WebUtility.HtmlEncode(expectedBody)))), Times.Once);
    }

    private sealed class SuccessHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.OK));
    }

    private sealed class Factory : IDbContextFactory<CopropertyDbContext>
    {
        private readonly DbContextOptions<CopropertyDbContext> options =
            new DbContextOptionsBuilder<CopropertyDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        public CopropertyDbContext CreateDbContext() => new(options);
    }
}
