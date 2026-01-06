namespace Myb.Coproperty.Models;

/// <summary>
/// Status of an invoice
/// </summary>
public enum InvoiceStatus
{
    Pending,
    PartiallyPaid,
    Paid,
    Overdue,
    Cancelled
}
