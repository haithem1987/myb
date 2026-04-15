using Myb.Common.Models;

namespace Myb.Coproperty.Models;

/// <summary>
/// Represents a payment applied to a specific fund call.
/// </summary>
public class FundCallPayment : IEntity<Guid>
{
    public Guid Id { get; set; }

    /// <summary>Fund call this payment belongs to</summary>
    public Guid FundCallId { get; set; }

    /// <summary>Amount paid</summary>
    public decimal Amount { get; set; }

    /// <summary>Date the payment was made</summary>
    public DateTime PaymentDate { get; set; }

    /// <summary>Reference / justificatif (e.g. receipt number, file path)</summary>
    public string? Justificatif { get; set; }

    /// <summary>Payment method (Espèces, Chèque, Virement, Mandat postal, etc.)</summary>
    public string? PaymentMethod { get; set; }

    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public Guid CreatedBy { get; set; }

    // Navigation
    public FundCall FundCall { get; set; } = null!;
}
