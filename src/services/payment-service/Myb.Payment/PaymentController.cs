using Myb.Payment.EntityFrameWork.Infra;
using Myb.Payment.Models;

namespace Myb.Payment;

using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly PaymentContext _context;

    public PaymentController(IPaymentService paymentService, PaymentContext context)
    {
        _paymentService = paymentService;
        _context = context;
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

            return Ok(new { clientSecret, PaymentId = payment.Id });
        }
        catch (Exception ex)
        {
            // Log the exception and return error response
            Console.Error.WriteLine($"Payment failed: {ex.Message}");
            return StatusCode(500, "An error occurred while processing your payment.");
        }
    }
    
    [HttpGet("subscriptions/{userId}")]
    public async Task<IActionResult> GetPaymentsByUserId(string userId)
    {
        try
        {
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
        var success = await _paymentService.UnsubscribeAsync(userId, serviceId);

        if (!success)
        {
            return NotFound($"No subscription found for user {userId} and service {serviceId}.");
        }

        return Ok($"Successfully unsubscribed from service {serviceId}.");
    }


}

public class PaymentRequest
{
    public decimal Amount { get; set; }
    public string Currency { get; set; }
    public string ReceiptEmail { get; set; }
    public string UserId { get; set; }           // New field: User ID
    public int ServiceId { get; set; }           // New field: Service ID
    public string ServiceName { get; set; }      // New field: Service Name
    public string? PaymentMethod { get; set; }    // New field: Payment Method
    public bool IsRecurring { get; set; }        // New field: Recurring Subscription?
}
