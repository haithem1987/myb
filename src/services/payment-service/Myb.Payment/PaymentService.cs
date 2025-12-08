using Stripe;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Myb.Payment.EntityFrameWork.Infra;
using Myb.Payment.Models;

namespace Myb.Payment
{
    public class PaymentService : IPaymentService
    {
        private readonly string _secretKey;
        private readonly PaymentContext _context;

        public PaymentService(IConfiguration configuration, PaymentContext context)
        {
            // Properly retrieve the Stripe secret key from the configuration
            _secretKey = configuration.GetValue<string>("Stripe:SecretKey");
            
            if (string.IsNullOrEmpty(_secretKey))
            {
                throw new Exception("Stripe secret key is missing in the configuration.");
            }

            // Set the API key for Stripe
            StripeConfiguration.ApiKey = _secretKey; 
            _context = context; 
        }

        public async Task<string> CreatePaymentIntentAsync(decimal amount, string currency, string receiptEmail)
        {
            var options = new PaymentIntentCreateOptions
            {
                Amount = (long)(amount * 100), // Stripe requires the amount to be in cents
                Currency = currency,
                ReceiptEmail = receiptEmail,
                PaymentMethodTypes = new List<string> { "card" },
            };

            var service = new PaymentIntentService();
            var paymentIntent = await service.CreateAsync(options);

            return paymentIntent.ClientSecret; // Send client secret to frontend
        }
      public async Task<List<StripePayment>> GetPaymentsByUserIdAsync(string userId)
{
    try
    {
        var payments = await _context.Payments
            .Where(p => p.UserId == userId)
            .ToListAsync();

        // Will return an empty list if no records match
        return payments;
    }
    catch (Exception ex)
    {
        // Log the exception if you have logging set up
        // _logger.LogError(ex, "An error occurred while retrieving payments for user {UserId}", userId);

        // Return an empty list as a fallback if an error occurs
        return new List<StripePayment>();
    }
}

        public async Task<bool> UnsubscribeAsync(string userId, int serviceId)
        {
            var subscription = await _context.Payments
                .FirstOrDefaultAsync(p => p.UserId == userId && p.ServiceId == serviceId);

            if (subscription == null)
            {
                return false; // Subscription not found
            }

            _context.Payments.Remove(subscription);
            await _context.SaveChangesAsync();

            return true; // Successfully unsubscribed
        }
    }
}