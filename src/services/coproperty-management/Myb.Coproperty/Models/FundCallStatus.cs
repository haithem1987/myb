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

    /// <summary>Payment submitted by owner, awaiting syndic review / en attente de validation</summary>
    PendingValidation,

    /// <summary>Payment has been received and validated / réglé</summary>
    Paid,

    /// <summary>Fund call is approved / validé</summary>
    Validated,

    /// <summary>Fund call was published/processed then cancelled by the syndic (no further payments allowed) / annulé</summary>
    Cancelled
}
