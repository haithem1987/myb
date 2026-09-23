using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using Myb.Common.Messaging;
using Myb.Common.Messaging.Models;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.Services;

public interface IOwnershipNotificationService
{
    Task NotifyOwnershipChangedAsync(
        Owner previousOwner,
        Owner newOwner,
        Unit unit,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Notifies both sides of an ownership transfer. Notification failures are
/// deliberately non-fatal: the ownership history must remain committed even
/// when the mailer or real-time notification service is temporarily unavailable.
/// </summary>
public sealed class OwnershipNotificationService : IOwnershipNotificationService
{
    private readonly IEmailPublisher _emailPublisher;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<OwnershipNotificationService> _logger;
    private readonly IKeycloakAdminService _keycloakAdminService;

    public OwnershipNotificationService(
        IEmailPublisher emailPublisher,
        IHttpClientFactory httpClientFactory,
        ILogger<OwnershipNotificationService> logger,
        IKeycloakAdminService keycloakAdminService)
    {
        _emailPublisher = emailPublisher;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _keycloakAdminService = keycloakAdminService;
    }

    public async Task NotifyOwnershipChangedAsync(
        Owner previousOwner,
        Owner newOwner,
        Unit unit,
        CancellationToken cancellationToken = default)
    {
        var unitNumber = unit.UnitNumber;
        var copropertyName = unit.Coproperty?.Name ?? unit.CopropertyName ?? "votre copropriété";

        await SendToOwnerAsync(
            previousOwner,
            "Modification de la propriété de votre lot",
            $"Vous n'êtes plus enregistré comme propriétaire du lot {unitNumber} de la copropriété {copropertyName}. Vos données et documents historiques restent inchangés.",
            "Change to your unit ownership",
            $"You are no longer registered as the owner of unit {unitNumber} in {copropertyName}. Your historical data and documents remain unchanged.",
            copropertyName,
            unitNumber,
            unit.Coproperty?.ManagerId,
            cancellationToken);

        await SendToOwnerAsync(
            newOwner,
            "Confirmation d'affectation d'un lot",
            $"Vous êtes désormais enregistré comme propriétaire du lot {unitNumber} de la copropriété {copropertyName}.",
            "Unit assignment confirmed",
            $"You are now registered as the owner of unit {unitNumber} in {copropertyName}.",
            copropertyName,
            unitNumber,
            unit.Coproperty?.ManagerId,
            cancellationToken);
    }

    private async Task SendToOwnerAsync(
        Owner owner,
        string subject,
        string message,
        string englishSubject,
        string englishMessage,
        string copropertyName,
        string unitNumber,
        Guid? managerId,
        CancellationToken cancellationToken)
    {
        var english = await _keycloakAdminService.GetPreferredLanguageAsync(owner.UserId.ToString()) == "en";
        subject = english ? englishSubject : subject;
        message = english ? englishMessage : message;
        if (!string.IsNullOrWhiteSpace(owner.Email))
        {
            try
            {
                await _emailPublisher.PublishAsync(new EmailMessage
                {
                    To = owner.Email,
                    Subject = subject,
                    Source = "Myb.Coproperty.ChangeUnitOwner",
                    HtmlBody = $"""
                        <html><body style="font-family:Arial,sans-serif;color:#333">
                          <h2 style="color:#2c5282">{WebUtility.HtmlEncode(subject)}</h2>
                          <p>{(english ? "Hello" : "Bonjour")} {WebUtility.HtmlEncode(owner.FirstName)},</p>
                          <p>{WebUtility.HtmlEncode(message)}</p>
                          <p><strong>{(english ? "Coproperty" : "Copropriété")}:</strong> {WebUtility.HtmlEncode(copropertyName)}<br/>
                             <strong>{(english ? "Unit" : "Lot")}:</strong> {WebUtility.HtmlEncode(unitNumber)}</p>
                          <hr/>
                          <p style="font-size:12px;color:#888">MYB – {(english ? "Coproperty management" : "Gestion de copropriété")}</p>
                        </body></html>
                        """
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to email owner {OwnerId} about unit {UnitId} ownership change", owner.Id, unitNumber);
            }
        }

        try
        {
            var client = _httpClientFactory.CreateClient("NotificationService");
            var response = await client.PostAsJsonAsync(
                "/api/Notifications",
                new
                {
                    SenderId = managerId?.ToString() ?? Guid.Empty.ToString(),
                    ReceiverId = owner.UserId.ToString(),
                    Message = message
                },
                cancellationToken);
            response.EnsureSuccessStatusCode();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send in-app ownership notification to owner {OwnerId}", owner.Id);
        }
    }
}
