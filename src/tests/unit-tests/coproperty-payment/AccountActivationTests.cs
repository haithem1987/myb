using System.Net;
using System.Security.Claims;
using Moq;
using Myb.Common.Messaging;
using Myb.Common.Messaging.Models;
using Myb.Coproperty.GraphQL.Mutations;
using Myb.Coproperty.Models.Dtos;
using Myb.Coproperty.Services;
using Myb.Coproperty.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

public class AccountActivationTests
{
    private class Handler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken token)
            => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
    }

    [Theory]
    [InlineData(false, "en", false)]
    [InlineData(true, "en", true)]
    [InlineData(true, "fr", true)]
    public async Task Activation_EmailsSyndicOnlyAfterVerifiedLogin(bool verified, string language, bool expected)
    {
        var userId = Guid.NewGuid().ToString();
        var recipientId = Guid.NewGuid().ToString();
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, userId), new Claim("name", "Owner <Name>") }, "test");
        var keycloak = new Mock<IKeycloakAdminService>();
        keycloak.Setup(k => k.IsEmailVerifiedAsync(userId)).ReturnsAsync(verified);
        keycloak.Setup(k => k.GetActivationNotificationRecipientAsync(userId)).ReturnsAsync(recipientId);
        keycloak.Setup(k => k.GetUserByIdAsync(recipientId)).ReturnsAsync(new ManagerDto(recipientId, "Syndic", "Test", "syndic@example.com"));
        keycloak.Setup(k => k.GetPreferredLanguageAsync(recipientId)).ReturnsAsync(language);
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient("NotificationService")).Returns(new HttpClient(new Handler()) { BaseAddress = new Uri("http://notification") });
        var mail = new Mock<IEmailPublisher>();
        mail.Setup(m => m.PublishAsync(It.IsAny<EmailMessage>())).Returns(Task.CompletedTask);
        Assert.Equal(expected, await new CopropertyMutations().ConfirmCurrentUserActivation(
            new ClaimsPrincipal(identity), keycloak.Object, factory.Object, mail.Object, new DbFactory()));
        mail.Verify(m => m.PublishAsync(It.Is<EmailMessage>(e => e.To == "syndic@example.com" && e.HtmlBody.Contains("&lt;Name&gt;") && e.Subject == (language == "en" ? "MYB account activated" : "Compte MYB activé"))), expected ? Times.Once() : Times.Never());
    }

    [Fact]
    public async Task FailedEmail_KeepsActivationPendingForRetry()
    {
        var userId = Guid.NewGuid().ToString();
        var recipientId = Guid.NewGuid().ToString();
        var dbFactory = new DbFactory();
        var keycloak = new Mock<IKeycloakAdminService>();
        keycloak.Setup(k => k.IsEmailVerifiedAsync(userId)).ReturnsAsync(true);
        keycloak.Setup(k => k.GetActivationNotificationRecipientAsync(userId)).ReturnsAsync(recipientId);
        keycloak.Setup(k => k.GetUserByIdAsync(recipientId)).ReturnsAsync(new ManagerDto(recipientId, "Syndic", "Test", "syndic@example.com"));
        var mail = new Mock<IEmailPublisher>();
        mail.Setup(m => m.PublishAsync(It.IsAny<EmailMessage>())).ThrowsAsync(new IOException("Queue unavailable"));
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, userId) }, "test"));
        await Assert.ThrowsAsync<IOException>(() => new CopropertyMutations().ConfirmCurrentUserActivation(
            user, keycloak.Object, Mock.Of<IHttpClientFactory>(), mail.Object, dbFactory));
        await using var context = dbFactory.CreateDbContext();
        Assert.Null((await context.AccountActivationNotifications.SingleAsync()).SentAt);
    }

    [Fact]
    public async Task Activation_WithoutTemporaryAttribute_UsesAssignedSyndicOnce()
    {
        var userId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var managerId = Guid.NewGuid();
        var factory = new DbFactory();
        await using (var context = factory.CreateDbContext())
        {
            var coproperty = new global::Myb.Coproperty.Models.Coproperty
                { Id = Guid.NewGuid(), Name = "Managed", ManagerId = managerId, IsActive = true };
            var unit = new global::Myb.Coproperty.Models.Unit
                { Id = Guid.NewGuid(), CopropertyId = coproperty.Id, Coproperty = coproperty, UnitNumber = "A1" };
            context.Owners.Add(new global::Myb.Coproperty.Models.Owner
                { Id = ownerId, UserId = userId, FirstName = "Owner", LastName = "Name" });
            context.Units.Add(unit);
            context.OwnerUnits.Add(new global::Myb.Coproperty.Models.OwnerUnit
                { Id = Guid.NewGuid(), OwnerId = ownerId, UnitId = unit.Id });
            await context.SaveChangesAsync();
        }
        var keycloak = new Mock<IKeycloakAdminService>();
        keycloak.Setup(k => k.IsEmailVerifiedAsync(userId.ToString())).ReturnsAsync(true);
        keycloak.Setup(k => k.GetUserByIdAsync(managerId.ToString()))
            .ReturnsAsync(new ManagerDto(managerId.ToString(), "Syndic", "Test", "syndic@example.com"));
        var http = new Mock<IHttpClientFactory>();
        http.Setup(f => f.CreateClient("NotificationService"))
            .Returns(new HttpClient(new Handler()) { BaseAddress = new Uri("http://notification") });
        var mail = new Mock<IEmailPublisher>();
        mail.Setup(m => m.PublishAsync(It.IsAny<EmailMessage>())).Returns(Task.CompletedTask);
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
            new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) }, "test"));

        Assert.True(await new CopropertyMutations().ConfirmCurrentUserActivation(
            principal, keycloak.Object, http.Object, mail.Object, factory));
        await using var verificationContext = factory.CreateDbContext();
        Assert.NotNull((await verificationContext.AccountActivationNotifications.SingleAsync()).SentAt);
    }

    [Fact]
    public async Task Activation_WithoutUnitOrRole_UsesDurableCreatorMappingOnlyOnce()
    {
        var userId = Guid.NewGuid();
        var managerId = Guid.NewGuid();
        var factory = new DbFactory();
        await using (var context = factory.CreateDbContext())
        {
            context.AccountActivationNotifications.Add(new global::Myb.Coproperty.Models.AccountActivationNotification
            {
                Id = Guid.NewGuid(), UserId = userId, RecipientUserId = managerId
            });
            await context.SaveChangesAsync();
        }
        var keycloak = new Mock<IKeycloakAdminService>();
        keycloak.Setup(k => k.IsEmailVerifiedAsync(userId.ToString())).ReturnsAsync(true);
        keycloak.Setup(k => k.GetUserByIdAsync(managerId.ToString()))
            .ReturnsAsync(new ManagerDto(managerId.ToString(), "Syndic", "Test", "syndic@example.com"));
        var http = new Mock<IHttpClientFactory>();
        http.Setup(f => f.CreateClient("NotificationService"))
            .Returns(new HttpClient(new Handler()) { BaseAddress = new Uri("http://notification") });
        var mail = new Mock<IEmailPublisher>();
        mail.Setup(m => m.PublishAsync(It.IsAny<EmailMessage>())).Returns(Task.CompletedTask);
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
            new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) }, "test"));
        var mutation = new CopropertyMutations();

        Assert.True(await mutation.ConfirmCurrentUserActivation(
            principal, keycloak.Object, http.Object, mail.Object, factory));
        Assert.False(await mutation.ConfirmCurrentUserActivation(
            principal, keycloak.Object, http.Object, mail.Object, factory));
        mail.Verify(m => m.PublishAsync(It.IsAny<EmailMessage>()), Times.Once());
    }

    private sealed class DbFactory : IDbContextFactory<CopropertyDbContext>
    {
        private readonly DbContextOptions<CopropertyDbContext> options =
            new DbContextOptionsBuilder<CopropertyDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        public CopropertyDbContext CreateDbContext() => new(options);
    }
}
