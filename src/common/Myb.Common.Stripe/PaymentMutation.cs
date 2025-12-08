using Stripe;
using HotChocolate;
namespace Myb.Common.Stripe;

public class PaymentMutation
{
    private readonly StripeService _stripeService;

    public PaymentMutation(StripeService stripeService)
    {
        _stripeService = stripeService;
    }

    public async Task<string> CreatePaymentIntent(decimal amount, string currency)
    {
        var paymentIntent = await _stripeService.CreatePaymentIntent(amount, currency);
        return paymentIntent.ClientSecret; // This is the key the front-end needs to confirm payment
    }

    public async Task<PaymentIntent> ConfirmPayment(string paymentIntentId, string paymentMethodId)
    {
        return await _stripeService.ConfirmPaymentIntent(paymentIntentId, paymentMethodId);
    }
}