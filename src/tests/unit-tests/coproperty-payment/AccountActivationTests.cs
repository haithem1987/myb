using System.Net;
using System.Security.Claims;
using Moq;
using Myb.Common.Messaging;
using Myb.Common.Messaging.Models;
using Myb.Coproperty.GraphQL.Mutations;
using Myb.Coproperty.Models.Dtos;
using Myb.Coproperty.Services;
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
        Assert.Equal(expected, await new CopropertyMutations().ConfirmCurrentUserActivation(new ClaimsPrincipal(identity), keycloak.Object, factory.Object, mail.Object));
        mail.Verify(m => m.PublishAsync(It.Is<EmailMessage>(e => e.To == "syndic@example.com" && e.HtmlBody.Contains("&lt;Name&gt;") && e.Subject == (language == "en" ? "MYB account activated" : "Compte MYB activé"))), expected ? Times.Once() : Times.Never());
        keycloak.Verify(k => k.ConsumeActivationNotificationRecipientAsync(userId), expected ? Times.Once() : Times.Never());
    }

    [Fact]
    public async Task FailedEmail_KeepsActivationPendingForRetry()
    {
        var userId = Guid.NewGuid().ToString();
        var keycloak = new Mock<IKeycloakAdminService>();
        keycloak.Setup(k => k.IsEmailVerifiedAsync(userId)).ReturnsAsync(true);
        keycloak.Setup(k => k.GetActivationNotificationRecipientAsync(userId)).ReturnsAsync("syndic");
        keycloak.Setup(k => k.GetUserByIdAsync("syndic")).ReturnsAsync(new ManagerDto("syndic", "Syndic", "Test", "syndic@example.com"));
        var mail = new Mock<IEmailPublisher>();
        mail.Setup(m => m.PublishAsync(It.IsAny<EmailMessage>())).ThrowsAsync(new IOException("Queue unavailable"));
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, userId) }, "test"));
        await Assert.ThrowsAsync<IOException>(() => new CopropertyMutations().ConfirmCurrentUserActivation(user, keycloak.Object, Mock.Of<IHttpClientFactory>(), mail.Object));
        keycloak.Verify(k => k.ConsumeActivationNotificationRecipientAsync(It.IsAny<string>()), Times.Never());
    }
}
