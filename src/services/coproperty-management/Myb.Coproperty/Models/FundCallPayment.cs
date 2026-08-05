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

    /// <summary>Original name of the payment-proof attachment.</summary>
    public string? JustificatifFileName { get; set; }

    /// <summary>MIME type of the payment-proof attachment.</summary>
    public string? JustificatifContentType { get; set; }

    /// <summary>Payment method (Espèces, Chèque, Virement, Mandat postal, etc.)</summary>
    public string? PaymentMethod { get; set; }

    /// <summary>Validation status set by the syndic: Pending, Approved, Rejected</summary>
    public string ValidationStatus { get; set; } = "Pending";

    /// <summary>Reason provided by the syndic when rejecting the payment</summary>
    public string? RejectionReason { get; set; }

    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public Guid CreatedBy { get; set; }

    // Navigation
    public FundCall FundCall { get; set; } = null!;
    public FundCallPaymentJustificatifFile? JustificatifFile { get; set; }
}

/// <summary>
/// Binary content is kept in a separate one-to-one table so ordinary fund-call
/// list queries never load multi-megabyte attachments.
/// </summary>
public class FundCallPaymentJustificatifFile
{
    public Guid FundCallPaymentId { get; set; }
    public byte[] FileData { get; set; } = Array.Empty<byte>();
    public FundCallPayment Payment { get; set; } = null!;
}
