using Microsoft.EntityFrameworkCore;
using Myb.Common.Messaging;
using Myb.Common.Messaging.Models;
using Myb.Coproperty.Infrastructure.Data;

namespace Myb.Coproperty.Services;

/// <summary>
/// Background service that sends monthly payment reminders to owners
/// with unpaid fund calls. Runs daily and triggers on the 1st of each month.
/// </summary>
public class FundCallReminderService : BackgroundService
{
    private readonly IDbContextFactory<CopropertyDbContext> _contextFactory;
    private readonly IEmailPublisher _emailPublisher;
    private readonly ILogger<FundCallReminderService> _logger;

    public FundCallReminderService(
        IDbContextFactory<CopropertyDbContext> contextFactory,
        IEmailPublisher emailPublisher,
        ILogger<FundCallReminderService> logger)
    {
        _contextFactory = contextFactory;
        _emailPublisher = emailPublisher;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("FundCallReminderService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var now = DateTime.UtcNow;

                // Send reminders on the 1st of each month
                if (now.Day == 1)
                {
                    await SendMonthlyRemindersAsync(stoppingToken);
                }

                // Wait until next day (check at midnight UTC)
                var nextRun = now.Date.AddDays(1);
                var delay = nextRun - now;
                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in FundCallReminderService. Will retry next cycle.");
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }

        _logger.LogInformation("FundCallReminderService stopped.");
    }

    private async Task SendMonthlyRemindersAsync(CancellationToken ct)
    {
        _logger.LogInformation("Sending monthly fund call reminders...");

        using var context = _contextFactory.CreateDbContext();

        // Get all active, unpaid fund calls with their owners and payments
        var unpaidFundCalls = await context.FundCalls
            .Where(f => f.IsActive && f.Status == Models.FundCallStatus.ToPay && f.OwnerId.HasValue)
            .Include(f => f.Owner)
            .Include(f => f.Payments)
            .Include(f => f.Coproperty)
            .ToListAsync(ct);

        // Group by owner
        var byOwner = unpaidFundCalls
            .Where(f => f.Owner != null && !string.IsNullOrEmpty(f.Owner.Email))
            .GroupBy(f => f.OwnerId!.Value);

        var sentCount = 0;

        foreach (var ownerGroup in byOwner)
        {
            var owner = ownerGroup.First().Owner!;
            var fundCallRows = new System.Text.StringBuilder();

            foreach (var fc in ownerGroup)
            {
                var paid = fc.Payments?.Sum(p => p.Amount) ?? 0;
                var remaining = fc.Amount - paid;
                var monthsLeft = Math.Max(1, (int)Math.Ceiling((fc.DueDate - DateTime.UtcNow).TotalDays / 30));
                var suggestedMonthly = Math.Ceiling(remaining / monthsLeft * 1000) / 1000;
                var copropertyName = fc.Coproperty?.Name ?? "-";

                fundCallRows.AppendLine($@"
                    <tr>
                        <td style='padding:8px;border:1px solid #ddd;'>{copropertyName}</td>
                        <td style='padding:8px;border:1px solid #ddd;'>{fc.Description ?? "Appel de fonds"}</td>
                        <td style='padding:8px;border:1px solid #ddd;text-align:right;'>{fc.Amount:N3} DT</td>
                        <td style='padding:8px;border:1px solid #ddd;text-align:right;color:green;'>{paid:N3} DT</td>
                        <td style='padding:8px;border:1px solid #ddd;text-align:right;color:red;font-weight:bold;'>{remaining:N3} DT</td>
                        <td style='padding:8px;border:1px solid #ddd;text-align:right;'>{suggestedMonthly:N3} DT</td>
                        <td style='padding:8px;border:1px solid #ddd;'>{fc.DueDate:dd/MM/yyyy}</td>
                    </tr>");
            }

            var totalRemaining = ownerGroup.Sum(f => f.Amount - (f.Payments?.Sum(p => p.Amount) ?? 0));

            var htmlBody = $@"
                <div style='font-family:Arial,sans-serif;max-width:700px;margin:0 auto;'>
                    <h2 style='color:#2c3e50;'>🔔 Rappel mensuel de paiement</h2>
                    <p>Bonjour {owner.FirstName} {owner.LastName},</p>
                    <p>Nous vous rappelons que vous avez des appels de fonds en attente de paiement.
                       Voici le récapitulatif :</p>

                    <table style='width:100%;border-collapse:collapse;margin:20px 0;'>
                        <thead>
                            <tr style='background:#f8f9fa;'>
                                <th style='padding:8px;border:1px solid #ddd;text-align:left;'>Copropriété</th>
                                <th style='padding:8px;border:1px solid #ddd;text-align:left;'>Description</th>
                                <th style='padding:8px;border:1px solid #ddd;text-align:right;'>Total</th>
                                <th style='padding:8px;border:1px solid #ddd;text-align:right;'>Payé</th>
                                <th style='padding:8px;border:1px solid #ddd;text-align:right;'>Restant</th>
                                <th style='padding:8px;border:1px solid #ddd;text-align:right;'>Mensualité suggérée</th>
                                <th style='padding:8px;border:1px solid #ddd;text-align:left;'>Échéance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fundCallRows}
                        </tbody>
                    </table>

                    <p style='font-size:18px;color:#e74c3c;font-weight:bold;'>
                        Total restant à payer : {totalRemaining:N3} DT
                    </p>

                    <p>Vous pouvez effectuer un paiement partiel (mensualité) ou régler le montant total
                       depuis votre espace propriétaire.</p>

                    <p style='color:#7f8c8d;font-size:12px;margin-top:30px;'>
                        Ceci est un rappel automatique envoyé le 1er de chaque mois.<br/>
                        Cordialement, L'équipe MYB
                    </p>
                </div>";

            try
            {
                await _emailPublisher.PublishAsync(new EmailMessage
                {
                    To = owner.Email,
                    Subject = $"Rappel de paiement - {totalRemaining:N3} DT restant",
                    HtmlBody = htmlBody,
                    Source = "coproperty-reminder"
                });
                sentCount++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send reminder to {Email}", owner.Email);
            }
        }

        _logger.LogInformation("Monthly reminders sent to {Count} owner(s).", sentCount);
    }
}
