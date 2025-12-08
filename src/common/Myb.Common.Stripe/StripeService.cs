using Stripe;
using System.Threading.Tasks;
namespace Myb.Common.Stripe;

public class StripeService
{
    private readonly string _apiKey;

    public StripeService(string apiKey)
    {
        _apiKey = apiKey;
        StripeConfiguration.ApiKey = _apiKey;
    }

    public async Task<PaymentIntent> CreatePaymentIntent(decimal amount, string currency)
    {
        var options = new PaymentIntentCreateOptions
        {
            Amount = (long)(amount * 100), // Stripe works in the smallest unit of the currency
            Currency = currency,
            PaymentMethodTypes = new List<string> { "card" },
        };

        var service = new PaymentIntentService();
        var paymentIntent = await service.CreateAsync(options);
        return paymentIntent;
    }

    public async Task<PaymentIntent> ConfirmPaymentIntent(string paymentIntentId, string paymentMethodId)
    {
        var options = new PaymentIntentConfirmOptions
        {
            PaymentMethod = paymentMethodId,
        };

        var service = new PaymentIntentService();
        var paymentIntent = await service.ConfirmAsync(paymentIntentId, options);
        return paymentIntent;
    }

}