namespace Myb.Coproperty.Models.Dtos;

/// <summary>
/// Input DTO for adding a payment to a fund call
/// </summary>
public class AddFundCallPaymentInput
{
    /// <summary>Payment amount</summary>
    public decimal Amount { get; set; }

    /// <summary>Date the payment was made</summary>
    public DateTime PaymentDate { get; set; }

    /// <summary>Reference / justificatif (receipt number, file path, etc.)</summary>
    public string? Justificatif { get; set; }

    /// <summary>Payment method (Espèces, Chèque, Virement, Mandat postal, etc.)</summary>
    public string? PaymentMethod { get; set; }
}
