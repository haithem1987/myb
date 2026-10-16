using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Myb.Notification.Configuration;
using Myb.Notification.Services;

namespace Myb.Notification.Tests;

public class WhatsAppSenderNormalizePhoneTests
{
    [Theory]
    [InlineData("+33612345678", "33612345678")]
    [InlineData("0033612345678", "0033612345678")]
    [InlineData("+213 6 12 34 56", "213612345 6")]   // spaces stripped after the +
    [InlineData("213-612-345-678", "213612345678")]
    [InlineData("+1 (555) 123-4567", "15551234567")]
    public void NormalizePhone_StripsLeadingPlusAndNonDigits(string input, string expected)
    {
        // spaces between digits: expected retains digits only
        var onlyDigits = new string(expected.Where(char.IsDigit).ToArray());
        Assert.Equal(onlyDigits, WhatsAppSender.NormalizePhone(input));
    }
}

public class WhatsAppSenderTests
{
    private static WhatsAppOptions ConfiguredOptions() => new()
    {
        Enabled = true,
        PhoneNumberId = "1234567890",
        AccessToken = "test-token",
        ApiVersion = "v19.0"
    };

    [Fact]
    public async Task ReturnsFalseWhenNotConfigured()
    {
        var sender = BuildSender(new WhatsAppOptions { Enabled = false }, _ => throw new Exception("should not be called"));
        var result = await sender.SendTemplateAsync("+33600000000", WhatsAppTemplate.RappelPaiement, []);
        Assert.False(result);
    }

    [Fact]
    public async Task ReturnsFalseForEmptyPhone()
    {
        var sender = BuildSender(ConfiguredOptions(), _ => throw new Exception("should not be called"));
        var result = await sender.SendTemplateAsync("", WhatsAppTemplate.ChargeDisponible, []);
        Assert.False(result);
    }

    [Fact]
    public async Task SendsCorrectTemplatePayload()
    {
        HttpRequestMessage? captured = null;
        string? capturedBody = null;

        var sender = BuildSender(ConfiguredOptions(), async req =>
        {
            captured = req;
            capturedBody = await req.Content!.ReadAsStringAsync();
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{\"messages\":[{\"id\":\"wamid.abc\"}]}")
            };
        });

        var result = await sender.SendTemplateAsync("+33612345678", WhatsAppTemplate.ChargeDisponible,
            ["Résidence Les Pins", "125,00 €"]);

        Assert.True(result);
        Assert.NotNull(captured);
        Assert.Equal(HttpMethod.Post, captured!.Method);
        Assert.Contains("1234567890/messages", captured.RequestUri!.ToString());

        var doc = JsonDocument.Parse(capturedBody!);
        var root = doc.RootElement;
        Assert.Equal("whatsapp", root.GetProperty("messaging_product").GetString());
        Assert.Equal("33612345678", root.GetProperty("to").GetString());
        Assert.Equal("template", root.GetProperty("type").GetString());
        Assert.Equal("myb_charge_disponible", root.GetProperty("template").GetProperty("name").GetString());
    }

    [Fact]
    public async Task ReturnsFalseOnHttpError()
    {
        var sender = BuildSender(ConfiguredOptions(), _ => Task.FromResult(
            new HttpResponseMessage(HttpStatusCode.Unauthorized)
            {
                Content = new StringContent("{\"error\":{\"message\":\"Invalid OAuth access token\"}}")
            }));

        var result = await sender.SendTemplateAsync("+33612345678", WhatsAppTemplate.RappelPaiement, []);
        Assert.False(result);
    }

    [Fact]
    public async Task ReturnsFalseOnNetworkException()
    {
        var sender = BuildSender(ConfiguredOptions(), _ => throw new HttpRequestException("connection refused"));
        var result = await sender.SendTemplateAsync("+33612345678", WhatsAppTemplate.CompteRenduAg, []);
        Assert.False(result);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private static WhatsAppSender BuildSender(
        WhatsAppOptions options,
        Func<HttpRequestMessage, Task<HttpResponseMessage>> handler)
    {
        var httpClient = new HttpClient(new FakeHttpHandler(handler));
        var factory = new FakeHttpClientFactory(httpClient);
        return new WhatsAppSender(factory, Options.Create(options), NullLogger<WhatsAppSender>.Instance);
    }

    private sealed class FakeHttpHandler(Func<HttpRequestMessage, Task<HttpResponseMessage>> handler)
        : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken) => handler(request);
    }

    private sealed class FakeHttpClientFactory(HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => client;
    }
}
