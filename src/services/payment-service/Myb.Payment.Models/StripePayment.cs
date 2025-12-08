using Myb.Common.Models;

namespace Myb.Payment.Models;

public class StripePayment:BaseEntity
{ // Primary key
    public string UserId { get; set; }           // User making the payment
    public int ServiceId { get; set; }           // ID of the subscribed service
    public string ServiceName { get; set; }      // Name of the subscribed service
    public decimal Price { get; set; }           // Price of the subscription
    public DateTime PaymentDate { get; set; }    // Date of payment
    public DateTime? ExpiryDate { get; set; }    // Expiry date of the subscription
    public string PaymentStatus { get; set; }    // Status (e.g., Paid, Pending, Failed)
    public string PaymentMethod { get; set; }    // Payment method (e.g., Credit Card, PayPal)
    public bool IsRecurring { get; set; }        // Indicates if it’s a recurring subscription
}