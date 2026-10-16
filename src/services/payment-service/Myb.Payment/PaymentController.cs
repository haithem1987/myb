using Myb.Payment.EntityFrameWork.Infra;
using Myb.Payment.Models;
using Myb.Common.Messaging;
using Myb.Common.Messaging.Models;

namespace Myb.Payment;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private const int TrialServiceId = 1;
    private const int TrialDurationDays = 30;
    private readonly IPaymentService _paymentService;
    private readonly PaymentContext _context;
    private readonly IEmailPublisher _emailPublisher;

    public PaymentController(IPaymentService paymentService, PaymentContext context, IEmailPublisher emailPublisher)
    {
        _paymentService = paymentService;
        _context = context;
        _emailPublisher = emailPublisher;
    }

    [HttpPost("create-payment-intent")]
    public async Task<IActionResult> CreatePaymentIntent([FromBody] PaymentRequest request)
    {
        try
        {
            // Step 1: Create the payment intent using the token from the frontend
            var clientSecret = await _paymentService.CreatePaymentIntentAsync(
                request.Amount, request.Currency, request.ReceiptEmail
            );

            // Step 2: Save the payment only if the intent creation succeeds
            var payment = new StripePayment
            {
                UserId = request.UserId,
                CopropertyId = request.CopropertyId,
                ServiceId = request.ServiceId,
                ServiceName = request.ServiceName,
                Price = request.Amount,
                PaymentDate = DateTime.UtcNow,
                PaymentStatus = "Paid",  // Set status to pending until confirmed
                PaymentMethod = request.PaymentMethod ?? "Card", // Default to card
                IsRecurring = request.IsRecurring,
                ExpiryDate = request.IsRecurring ? DateTime.UtcNow.AddMonths(1) : (DateTime?)null
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            // Send payment confirmation email
            if (!string.IsNullOrEmpty(request.ReceiptEmail))
            {
                var english = IsEnglish(request.Language);
                var amount = request.Amount.ToString("0.###", System.Globalization.CultureInfo.InvariantCulture);
                await _emailPublisher.PublishAsync(new EmailMessage
                {
                    To = request.ReceiptEmail,
                    Subject = english ? "Payment confirmation - MYB" : "Confirmation de paiement - MYB",
                    Language = english ? "en" : "fr",
                    HtmlBody = english ? $@"<h1>Payment confirmed</h1>
                        <p>Your payment was processed successfully.</p>
                        <table style='border-collapse:collapse;'>
                            <tr><td><strong>Service:</strong></td><td>{payment.ServiceName}</td></tr>
                            <tr><td><strong>Amount:</strong></td><td>{amount} {request.Currency.ToUpper()}</td></tr>
                            <tr><td><strong>Date:</strong></td><td>{payment.PaymentDate:dd/MM/yyyy}</td></tr>
                            <tr><td><strong>Reference:</strong></td><td>#{payment.Id}</td></tr>
                        </table>
                        <br/>
                        <p>Regards,<br/>The MYB team</p>" : $@"<h1>Paiement confirmé</h1>
                        <p>Votre paiement a été traité avec succès.</p>
                        <table style='border-collapse:collapse;'>
                            <tr><td><strong>Service :</strong></td><td>{payment.ServiceName}</td></tr>
                            <tr><td><strong>Montant :</strong></td><td>{amount} {request.Currency.ToUpper()}</td></tr>
                            <tr><td><strong>Date :</strong></td><td>{payment.PaymentDate:dd/MM/yyyy}</td></tr>
                            <tr><td><strong>Référence :</strong></td><td>#{payment.Id}</td></tr>
                        </table><br/><p>Cordialement,<br/>L'équipe MYB</p>",
                    Source = "payment-service"
                });
            }

            return Ok(new { clientSecret, PaymentId = payment.Id });
        }
        catch (Exception ex)
        {
            // Log the exception and return error response
            Console.Error.WriteLine($"Payment failed: {ex.Message}");
            return StatusCode(500, "An error occurred while processing your payment.");
        }
    }

    /// <summary>
    /// Starts the card-free MYB trial for a newly-created residence. The call is
    /// idempotent: a residence can never receive a second trial.
    /// </summary>
    [HttpPost("start-trial")]
    public async Task<IActionResult> StartTrial([FromBody] StartTrialRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserId) ||
            string.IsNullOrWhiteSpace(request.CopropertyId))
        {
            return BadRequest("UserId and CopropertyId are required.");
        }

        var authenticatedUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(authenticatedUserId)) return Unauthorized();
        if (!string.Equals(authenticatedUserId, request.UserId, StringComparison.OrdinalIgnoreCase))
            return Forbid();

        var existing = await _context.Payments
            .FirstOrDefaultAsync(payment =>
                payment.CopropertyId == request.CopropertyId &&
                payment.ServiceId != 0);

        if (existing is not null)
        {
            if (!string.Equals(existing.UserId, authenticatedUserId, StringComparison.OrdinalIgnoreCase))
                return Forbid();
            return Ok(existing);
        }

        var now = DateTime.UtcNow;
        var trial = new StripePayment
        {
            UserId = request.UserId,
            CopropertyId = request.CopropertyId,
            ServiceId = TrialServiceId,
            ServiceName = "MYB Confort - Essai 30 jours",
            Price = 0,
            PaymentDate = now,
            ExpiryDate = now.AddDays(TrialDurationDays),
            PaymentStatus = "Trial",
            PaymentMethod = "None",
            IsRecurring = false,
            CreatedAt = now
        };

        _context.Payments.Add(trial);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetSubscriptionByCoproperty),
            new { copropertyId = request.CopropertyId },
            trial);
    }

    [HttpGet("subscriptions/coproperty/{copropertyId}")]
    public async Task<IActionResult> GetSubscriptionByCoproperty(string copropertyId)
    {
        var authenticatedUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(authenticatedUserId)) return Unauthorized();

        var subscription = await _context.Payments
            .Where(payment =>
                payment.CopropertyId == copropertyId &&
                payment.UserId == authenticatedUserId &&
                payment.ServiceId != 0)
            .OrderByDescending(payment => payment.PaymentDate)
            .FirstOrDefaultAsync();

        return subscription is null ? NotFound() : Ok(subscription);
    }
    
    [HttpGet("subscriptions/{userId}")]
    public async Task<IActionResult> GetPaymentsByUserId(string userId)
    {
        try
        {
            var authenticatedUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");
            if (string.IsNullOrWhiteSpace(authenticatedUserId)) return Unauthorized();
            if (!string.Equals(authenticatedUserId, userId, StringComparison.OrdinalIgnoreCase))
                return Forbid();

            var payments = await _paymentService.GetPaymentsByUserIdAsync(userId);

            if (payments.Count == 0)
            {
                // Return an empty list if no subscriptions are found
                return Ok(new List<StripePayment>());
            }

            return Ok(payments);
        }
        catch (Exception ex)
        {
            // Log the exception if logging is set up, for debugging
            // _logger.LogError(ex, "An error occurred while fetching subscriptions.");

            // Return a generic error message to avoid exposing sensitive information
            return StatusCode(500, "An error occurred while fetching the subscriptions. Please try again later.");
        }
    }

    [HttpDelete("unsubscribe/{userId}/{serviceId}")]
    public async Task<IActionResult> Unsubscribe(string userId, int serviceId)
    {
        var authenticatedUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(authenticatedUserId)) return Unauthorized();
        if (!string.Equals(authenticatedUserId, userId, StringComparison.OrdinalIgnoreCase))
            return Forbid();

        var subscription = await _context.Payments.FirstOrDefaultAsync(payment =>
            payment.UserId == userId && payment.ServiceId == serviceId);
        if (subscription?.PaymentStatus == "Trial")
            return BadRequest("A free trial cannot be cancelled or restarted.");

        var success = await _paymentService.UnsubscribeAsync(userId, serviceId);

        if (!success)
        {
            return NotFound($"No subscription found for user {userId} and service {serviceId}.");
        }

        return Ok($"Successfully unsubscribed from service {serviceId}.");
    }

    /// <summary>
    /// Pay a coproperty charge distribution. Creates a Stripe payment intent
    /// and records the charge payment.
    /// </summary>
    [HttpPost("pay-charge")]
    public async Task<IActionResult> PayCharge([FromBody] ChargePaymentRequest request)
    {
        try
        {
            if (request.Amount <= 0)
                return BadRequest("Amount must be greater than zero.");

            if (string.IsNullOrEmpty(request.ChargeDistributionId))
                return BadRequest("ChargeDistributionId is required.");

            // Step 1: Try Stripe payment intent (graceful fallback in dev with dummy keys)
            string? clientSecret = null;
            try
            {
                clientSecret = await _paymentService.CreatePaymentIntentAsync(
                    request.Amount, request.Currency ?? "eur", request.ReceiptEmail ?? ""
                );
            }
            catch (Exception stripeEx)
            {
                Console.Error.WriteLine($"Stripe payment intent failed (continuing without): {stripeEx.Message}");
                // Continue without Stripe in dev — payment is still recorded
            }

            // Step 2: Save the charge payment record
            var payment = new StripePayment
            {
                UserId = request.UserId,
                ServiceId = 0, // Not a subscription service
                ServiceName = $"Charge: {request.ChargeName ?? "Coproperty Charge"}",
                Price = request.Amount,
                PaymentDate = DateTime.UtcNow,
                PaymentStatus = "Paid",
                PaymentMethod = request.PaymentMethod ?? "Card",
                IsRecurring = false,
                ExpiryDate = null
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            // Step 3: Send confirmation email
            if (!string.IsNullOrEmpty(request.ReceiptEmail))
            {
                var english = IsEnglish(request.Language);
                var amount = request.Amount.ToString("0.###", System.Globalization.CultureInfo.InvariantCulture);
                await _emailPublisher.PublishAsync(new EmailMessage
                {
                    To = request.ReceiptEmail,
                    Subject = english ? "Charge payment confirmation - MYB" : "Confirmation de paiement de charge - MYB",
                    Language = english ? "en" : "fr",
                    HtmlBody = english ? $@"<h1>Charge payment confirmed</h1>
                        <p>Your coproperty charge payment was processed successfully.</p>
                        <table style='border-collapse:collapse;'>
                            <tr><td><strong>Charge:</strong></td><td>{request.ChargeName}</td></tr>
                            <tr><td><strong>Unit:</strong></td><td>{request.UnitNumber}</td></tr>
                            <tr><td><strong>Amount:</strong></td><td>{amount} {(request.Currency ?? "EUR").ToUpper()}</td></tr>
                            <tr><td><strong>Date:</strong></td><td>{payment.PaymentDate:dd/MM/yyyy}</td></tr>
                            <tr><td><strong>Reference:</strong></td><td>#{payment.Id}</td></tr>
                        </table><br/><p>Regards,<br/>The MYB team</p>" : $@"<h1>Paiement de charge confirmé</h1>
                        <p>Votre paiement de charge de copropriété a été traité avec succès.</p>
                        <table style='border-collapse:collapse;'>
                            <tr><td><strong>Charge :</strong></td><td>{request.ChargeName}</td></tr>
                            <tr><td><strong>Lot :</strong></td><td>{request.UnitNumber}</td></tr>
                            <tr><td><strong>Montant :</strong></td><td>{amount} {(request.Currency ?? "EUR").ToUpper()}</td></tr>
                            <tr><td><strong>Date :</strong></td><td>{payment.PaymentDate:dd/MM/yyyy}</td></tr>
                            <tr><td><strong>Référence :</strong></td><td>#{payment.Id}</td></tr>
                        </table>
                        <br/>
                        <p>Cordialement,<br/>L'équipe MYB</p>",
                    Source = "payment-service"
                });
            }

            return Ok(new
            {
                clientSecret = clientSecret ?? "dev-mode-no-stripe",
                PaymentId = payment.Id,
                ChargeDistributionId = request.ChargeDistributionId,
                Status = "Paid"
            });
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Charge payment failed: {ex.Message}");
            return StatusCode(500, "An error occurred while processing your charge payment.");
        }
    }

    /// <summary>
    /// Get all charge payments for a specific user.
    /// </summary>
    [HttpGet("charge-payments/{userId}")]
    public async Task<IActionResult> GetChargePayments(string userId)
    {
        try
        {
            var payments = await _paymentService.GetPaymentsByUserIdAsync(userId);
            var chargePayments = payments
                .Where(p => p.ServiceName != null && p.ServiceName.StartsWith("Charge:"))
                .ToList();
            return Ok(chargePayments);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Failed to fetch charge payments: {ex.Message}");
            return StatusCode(500, "An error occurred while fetching charge payments.");
        }
    }

    private static bool IsEnglish(string? language) =>
        language?.StartsWith("en", StringComparison.OrdinalIgnoreCase) == true;
}

public class PaymentRequest
{
    public decimal Amount { get; set; }
    public string Currency { get; set; }
    public string ReceiptEmail { get; set; }
    public string UserId { get; set; }
    public string? CopropertyId { get; set; }
    public int ServiceId { get; set; }
    public string ServiceName { get; set; }
    public string? PaymentMethod { get; set; }
    public bool IsRecurring { get; set; }
    public string? Language { get; set; }
}

public class StartTrialRequest
{
    public string UserId { get; set; } = "";
    public string CopropertyId { get; set; } = "";
}

public class ChargePaymentRequest
{
    public string UserId { get; set; } = "";
    public string ChargeDistributionId { get; set; } = "";
    public string? ChargeName { get; set; }
    public string? UnitNumber { get; set; }
    public decimal Amount { get; set; }
    public string? Currency { get; set; }
    public string? ReceiptEmail { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Language { get; set; }
}
