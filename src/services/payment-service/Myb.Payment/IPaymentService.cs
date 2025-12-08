using Myb.Payment.Models;

namespace Myb.Payment;

public interface IPaymentService
{
    Task<string> CreatePaymentIntentAsync(decimal amount, string currency, string receiptEmail);
    Task<List<StripePayment>> GetPaymentsByUserIdAsync(string userId);
    Task<bool> UnsubscribeAsync(string userId, int serviceId);
}
