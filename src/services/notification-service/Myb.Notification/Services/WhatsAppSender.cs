using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Myb.Notification.Configuration;

namespace Myb.Notification.Services;

public enum WhatsAppTemplate
{
    ChargeDisponible,
    RappelPaiement,
    CompteRenduAg
}

public interface IWhatsAppSender
{
    /// <summary>Sends using the global (env-var) config. Returns false when not configured or on failure.</summary>
    Task<bool> SendTemplateAsync(
        string toPhone, WhatsAppTemplate template, string[] parameters,
        CancellationToken cancellationToken = default);

    /// <summary>Sends using per-coproperty credentials (overrides global config).</summary>
    Task<bool> SendTemplateAsync(
        string phoneNumberId, string accessToken, string apiVersion,
        string toPhone, WhatsAppTemplate template, string[] parameters,
        CancellationToken cancellationToken = default);
}

public class WhatsAppSender : IWhatsAppSender
{
    public const string HttpClientName = "whatsapp";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private static readonly Dictionary<WhatsAppTemplate, string> TemplateNames = new()
    {
        [WhatsAppTemplate.ChargeDisponible] = "myb_charge_disponible",
        [WhatsAppTemplate.RappelPaiement]   = "myb_rappel_paiement",
        [WhatsAppTemplate.CompteRenduAg]    = "myb_compte_rendu_ag",
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly WhatsAppOptions _options;
    private readonly ILogger<WhatsAppSender> _logger;

    public WhatsAppSender(
        IHttpClientFactory httpClientFactory,
        IOptions<WhatsAppOptions> options,
        ILogger<WhatsAppSender> logger)
    {
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
        _logger = logger;
    }

    public Task<bool> SendTemplateAsync(
        string toPhone, WhatsAppTemplate template, string[] parameters,
        CancellationToken cancellationToken = default)
    {
        if (!_options.IsConfigured) return Task.FromResult(false);
        return SendTemplateAsync(
            _options.PhoneNumberId, _options.AccessToken, _options.ApiVersion,
            toPhone, template, parameters, cancellationToken);
    }

    public async Task<bool> SendTemplateAsync(
        string phoneNumberId, string accessToken, string apiVersion,
        string toPhone, WhatsAppTemplate template, string[] parameters,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(toPhone)) return false;

        var bodyComponents = parameters.Length > 0
            ? new object[]
            {
                new
                {
                    type = "body",
                    parameters = parameters.Select(p => new { type = "text", text = p }).ToArray()
                }
            }
            : Array.Empty<object>();

        var payload = new
        {
            messaging_product = "whatsapp",
            to = NormalizePhone(toPhone),
            type = "template",
            template = new
            {
                name = TemplateNames[template],
                language = new { code = "fr" },
                components = bodyComponents
            }
        };

        var client = _httpClientFactory.CreateClient(HttpClientName);
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", accessToken);

        var url = $"https://graph.facebook.com/{apiVersion}/{phoneNumberId}/messages";
        var content = new StringContent(
            JsonSerializer.Serialize(payload, JsonOptions),
            System.Text.Encoding.UTF8, "application/json");

        try
        {
            var response = await client.PostAsync(url, content, cancellationToken);
            if (response.IsSuccessStatusCode) return true;

            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("WhatsApp API {Status}: {Body}", (int)response.StatusCode, body);
            return false;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "WhatsApp send failed for {Phone}", MaskPhone(toPhone));
            return false;
        }
    }

    /// <summary>Meta Graph API expects digits only, no leading '+' or spaces.</summary>
    internal static string NormalizePhone(string phone)
    {
        var stripped = new string(phone.Where(c => char.IsDigit(c) || c == '+').ToArray());
        return stripped.StartsWith('+') ? stripped[1..] : stripped;
    }

    private static string MaskPhone(string phone) =>
        phone.Length > 4 ? $"***{phone[^4..]}" : "****";
}
