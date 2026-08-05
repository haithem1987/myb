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

    public string? JustificatifFileName { get; set; }
    public string? JustificatifContentType { get; set; }
    public string? JustificatifFileBase64 { get; set; }
}

public class PaymentJustificatifPayload
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string Base64Data { get; set; } = string.Empty;
}
