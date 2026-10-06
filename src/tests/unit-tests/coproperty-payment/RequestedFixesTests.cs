using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Myb.Coproperty.GraphQL.Mutations;
using Myb.Coproperty.GraphQL.Types;
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
        var service = new ChargeService(null!, null!, null!, null!, null!, null!, null!);
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
    public async Task CreateSignalement_RejectsInactiveCoproperty()
    {
        var copropertyId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var copropertyService = new Mock<ICopropertyService>();
        copropertyService.Setup(service => service.GetByIdAsync(copropertyId)).ReturnsAsync(
            new global::Myb.Coproperty.Models.Coproperty
                { Id = copropertyId, Name = "Inactive", IsActive = false });
        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, CopropertyAccessControl.OwnerRole)
        }, "test"));

        var error = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            new SignalementMutations().CreateSignalement(
                new CreateSignalementInput { CopropertyId = copropertyId.ToString() },
                principal, Mock.Of<ISignalementService>(), Mock.Of<IOwnerService>(),
                copropertyService.Object));

        Assert.Contains("inactive", error.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ChangeUnitOwner_RejectsInactiveCoproperty()
    {
        var factory = new Factory();
        var copropertyId = Guid.NewGuid();
        var unitId = Guid.NewGuid();
        var newOwnerId = Guid.NewGuid();
        await using (var context = factory.CreateDbContext())
        {
            context.Coproperties.Add(new global::Myb.Coproperty.Models.Coproperty
                { Id = copropertyId, Name = "Inactive", IsActive = false });
            context.Units.Add(new Unit
                { Id = unitId, CopropertyId = copropertyId, UnitNumber = "P03" });
            context.Owners.Add(new Owner
                { Id = newOwnerId, UserId = Guid.NewGuid(), Email = "new@example.com" });
            await context.SaveChangesAsync();
        }

        var error = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            new OwnerMutations().ChangeUnitOwner(
                unitId, newOwnerId, factory, Mock.Of<IOwnershipNotificationService>()));

        Assert.Contains("inactive", error.Message, StringComparison.OrdinalIgnoreCase);
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
            "New", "Name", "new@example.com", "+216 555", principal, factory,
            Mock.Of<IKeycloakAdminService>()));

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

    [Fact]
    public async Task ResidenceOverdueTotal_AggregatesAllOwnersAndOnlyApprovedPayments()
    {
        var factory = new Factory();
        var copropertyId = Guid.NewGuid();
        var otherCopropertyId = Guid.NewGuid();
        var firstOverdueId = Guid.NewGuid();
        var secondOverdueId = Guid.NewGuid();

        await using (var context = factory.CreateDbContext())
        {
            context.Coproperties.AddRange(
                new global::Myb.Coproperty.Models.Coproperty
                    { Id = copropertyId, Name = "Selected", IsActive = true },
                new global::Myb.Coproperty.Models.Coproperty
                    { Id = otherCopropertyId, Name = "Other", IsActive = true });
            context.FundCalls.AddRange(
                new FundCall
                {
                    Id = firstOverdueId, CopropertyId = copropertyId, OwnerId = Guid.NewGuid(),
                    Amount = 1_000m, DueDate = DateTime.UtcNow.AddDays(-10),
                    Description = "Owner one", Status = FundCallStatus.ToPay, IsActive = true
                },
                new FundCall
                {
                    Id = secondOverdueId, CopropertyId = copropertyId, OwnerId = Guid.NewGuid(),
                    Amount = 500m, DueDate = DateTime.UtcNow.AddDays(-2),
                    Description = "Owner two", Status = FundCallStatus.PendingValidation, IsActive = true
                },
                new FundCall
                {
                    Id = Guid.NewGuid(), CopropertyId = copropertyId, Amount = 900m,
                    DueDate = DateTime.UtcNow.AddDays(2), Description = "Not overdue",
                    Status = FundCallStatus.ToPay, IsActive = true
                },
                new FundCall
                {
                    Id = Guid.NewGuid(), CopropertyId = copropertyId, Amount = 800m,
                    DueDate = DateTime.UtcNow.AddDays(-2), Description = "Cancelled",
                    Status = FundCallStatus.Cancelled, IsActive = false
                },
                new FundCall
                {
                    Id = Guid.NewGuid(), CopropertyId = otherCopropertyId, Amount = 700m,
                    DueDate = DateTime.UtcNow.AddDays(-2), Description = "Other coproperty",
                    Status = FundCallStatus.ToPay, IsActive = true
                });
            context.FundCallPayments.AddRange(
                new FundCallPayment
                {
                    Id = Guid.NewGuid(), FundCallId = firstOverdueId, Amount = 250m,
                    PaymentDate = DateTime.UtcNow, ValidationStatus = "Approved"
                },
                new FundCallPayment
                {
                    Id = Guid.NewGuid(), FundCallId = secondOverdueId, Amount = 100m,
                    PaymentDate = DateTime.UtcNow, ValidationStatus = "Pending"
                });
            await context.SaveChangesAsync();
        }

        var service = new FundCallService(
            factory, Mock.Of<Myb.Common.Messaging.IEmailPublisher>(),
            Mock.Of<IHttpClientFactory>(), Mock.Of<IKeycloakAdminService>(),
            Mock.Of<IConfiguration>());

        var total = await service.GetCopropertyOverdueTotalAsync(copropertyId);

        Assert.Equal(1_250m, total);
    }

    [Fact]
    public async Task CreatingFundCall_WaitsUntilOwnerEmailIsQueued()
    {
        var factory = new Factory();
        var copropertyId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();
        await using (var context = factory.CreateDbContext())
        {
            context.Coproperties.Add(new global::Myb.Coproperty.Models.Coproperty
                { Id = copropertyId, Name = "Residence", IsActive = true });
            context.Owners.Add(new Owner
            {
                Id = ownerId, UserId = ownerUserId, Email = "owner@example.com",
                FirstName = "Owner", LastName = "One"
            });
            await context.SaveChangesAsync();
        }

        var publishStarted = new TaskCompletionSource(
            TaskCreationOptions.RunContinuationsAsynchronously);
        var allowPublishToFinish = new TaskCompletionSource(
            TaskCreationOptions.RunContinuationsAsynchronously);
        var mail = new Mock<Myb.Common.Messaging.IEmailPublisher>();
        mail.Setup(publisher => publisher.PublishAsync(
                It.Is<Myb.Common.Messaging.Models.EmailMessage>(message =>
                    message.To == "owner@example.com" && message.Language == "en")))
            .Callback(() => publishStarted.SetResult())
            .Returns(allowPublishToFinish.Task);
        var directory = new Mock<IKeycloakAdminService>();
        directory.Setup(service => service.GetPreferredLanguageAsync(ownerUserId.ToString()))
            .ReturnsAsync("en");
        var service = new FundCallService(
            factory, mail.Object, Mock.Of<IHttpClientFactory>(), directory.Object,
            Mock.Of<IConfiguration>());

        var createTask = service.CreateAsync(new Myb.Coproperty.Models.Dtos.CreateFundCallInput
        {
            CopropertyId = copropertyId,
            OwnerId = ownerId,
            Amount = 375.125m,
            Description = "Quarterly budget",
            DueDate = DateTime.UtcNow.AddDays(15),
            Status = FundCallStatus.ToPay
        }, Guid.NewGuid().ToString());

        await publishStarted.Task.WaitAsync(TimeSpan.FromSeconds(2));
        Assert.False(createTask.IsCompleted);
        allowPublishToFinish.SetResult();
        await createTask;

        mail.VerifyAll();
    }

    [Fact]
    public async Task ApprovedPaymentEmail_IsEntirelyEnglishForEnglishOwner()
    {
        var factory = new Factory();
        var ownerId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();
        var copropertyId = Guid.NewGuid();
        var fundCallId = Guid.NewGuid();
        var paymentId = Guid.NewGuid();
        await using (var context = factory.CreateDbContext())
        {
            context.Coproperties.Add(new global::Myb.Coproperty.Models.Coproperty
                { Id = copropertyId, Name = "Residence", IsActive = true });
            context.Owners.Add(new Owner
            {
                Id = ownerId, UserId = ownerUserId, Email = "owner@example.com",
                FirstName = "Owner", LastName = "Test"
            });
            context.FundCalls.Add(new FundCall
            {
                Id = fundCallId, CopropertyId = copropertyId, OwnerId = ownerId,
                Amount = 500m, Description = "Appel de fonds - Répartition 2026",
                DueDate = DateTime.UtcNow.AddDays(15), Status = FundCallStatus.PendingValidation,
                IsActive = true, CurrencySnapshot = Currency.EUR
            });
            context.FundCallPayments.Add(new FundCallPayment
            {
                Id = paymentId, FundCallId = fundCallId, Amount = 100m,
                PaymentDate = DateTime.UtcNow, ValidationStatus = "Pending"
            });
            await context.SaveChangesAsync();
        }

        Myb.Common.Messaging.Models.EmailMessage? sent = null;
        var mail = new Mock<Myb.Common.Messaging.IEmailPublisher>();
        mail.Setup(publisher => publisher.PublishAsync(It.IsAny<Myb.Common.Messaging.Models.EmailMessage>()))
            .Callback<Myb.Common.Messaging.Models.EmailMessage>(message => sent = message)
            .Returns(Task.CompletedTask);
        var directory = new Mock<IKeycloakAdminService>();
        directory.Setup(service => service.GetPreferredLanguageAsync(ownerUserId.ToString()))
            .ReturnsAsync("en");
        var service = new FundCallService(
            factory, mail.Object, Mock.Of<IHttpClientFactory>(), directory.Object,
            Mock.Of<IConfiguration>());

        await service.ReviewPaymentAsync(paymentId, true, null, Guid.NewGuid().ToString());

        Assert.NotNull(sent);
        Assert.Equal("en", sent!.Language);
        Assert.Equal("[MYB] Payment approved – Call for funds", sent.Subject);
        Assert.Contains("Your payment was approved", sent.HtmlBody);
        Assert.Contains("MYB Coproperty", sent.HtmlBody);
        Assert.Contains("View my calls for funds", sent.HtmlBody);
        Assert.DoesNotContain("Paiement", sent.Subject);
        Assert.DoesNotContain("Votre paiement", sent.HtmlBody);
        Assert.DoesNotContain("MYB Copropriété", sent.HtmlBody);
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

    [Theory]
    [InlineData("en", "Welcome to MYB", "Open my owner space")]
    [InlineData("fr", "Bienvenue sur MYB", "Accéder à mon espace propriétaire")]
    public async Task OwnerAccessEmail_UsesRecipientLanguageAndValidPortalLink(
        string language, string expectedSubject, string expectedCta)
    {
        var owner = new Owner
        {
            Id = Guid.NewGuid(), UserId = Guid.NewGuid(), Email = "owner@example.com",
            FirstName = "Owner", LastName = "Test"
        };
        var directory = new Mock<IKeycloakAdminService>();
        directory.Setup(service => service.GetPreferredLanguageAsync(owner.UserId.ToString()))
            .ReturnsAsync(language);
        var mail = new Mock<Myb.Common.Messaging.IEmailPublisher>();
        var service = new OwnerService(
            Mock.Of<IOwnerRepository>(), mail.Object,
            Options.Create(new KeycloakOptions
                { OwnerPortalUrl = "https://myb-platform.com/coproperty/owner/dashboard" }),
            new Factory(), directory.Object);

        await service.SendOwnerAccessEmailAsync(owner);

        mail.Verify(publisher => publisher.PublishAsync(
            It.Is<Myb.Common.Messaging.Models.EmailMessage>(message =>
                message.To == owner.Email &&
                message.Language == language &&
                message.Subject.Contains(expectedSubject) &&
                message.HtmlBody.Contains(expectedCta) &&
                message.HtmlBody.Contains("https://myb-platform.com/coproperty/owner/dashboard"))),
            Times.Once);
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
