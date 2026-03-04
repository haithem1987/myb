namespace Myb.Coproperty.Models;

/// <summary>
/// Status of a fund call (appel de fonds)
/// Stored as string in the database in English.
/// Translated to French in the frontend.
/// </summary>
public enum FundCallStatus
{
    /// <summary>Payment is expected / à payer</summary>
    ToPay,

    /// <summary>Payment has been received / réglé</summary>
    Paid,

    /// <summary>Fund call is approved / validé</summary>
    Validated
}
