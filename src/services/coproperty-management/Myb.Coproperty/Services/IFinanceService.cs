using Myb.Coproperty.Models;
using Myb.Coproperty.Models.Dtos;

namespace Myb.Coproperty.Services;

/// <summary>
/// Service interface for financial operations including invoice generation, payment recording, and treasury management
/// </summary>
public interface IFinanceService
{
    /// <summary>
    /// Get treasury evolution data for a coproperty over specified months
    /// </summary>
    Task<List<TreasuryDataPoint>> GetTreasuryEvolutionAsync(Guid copropertyId, int months = 12);

    /// <summary>
    /// Generate invoices from a charge for all units with charge distribution
    /// </summary>
    Task<List<CopropertyInvoice>> GenerateInvoicesFromChargeAsync(Guid chargeId, string createdBy);

    /// <summary>
    /// Record a payment for an invoice and update its status
    /// </summary>
    Task<Payment> RecordPaymentAsync(RecordPaymentInput input, string createdBy);

    /// <summary>
    /// Send payment reminder for overdue invoice
    /// </summary>
    Task SendPaymentReminderAsync(Guid invoiceId, int level = 1);

    /// <summary>
    /// Generate financial report for a coproperty
    /// </summary>
    Task<FinancialReport> GenerateFinancialReportAsync(Guid copropertyId, int year);

    /// <summary>
    /// Get dashboard statistics
    /// </summary>
    Task<DashboardStats> GetDashboardStatsAsync(Guid? copropertyId = null);

    /// <summary>
    /// Get full treasury dashboard (real + accounting treasury)
    /// </summary>
    Task<TreasuryDashboard> GetTreasuryDashboardAsync(Guid copropertyId, int months = 12);

    /// <summary>
    /// Get unpaid/late payment summary for a coproperty
    /// </summary>
    Task<UnpaidPaymentsSummary> GetUnpaidPaymentsSummaryAsync(Guid copropertyId);

    /// <summary>
    /// Get payment summary for a specific owner
    /// </summary>
    Task<OwnerPaymentSummary> GetOwnerPaymentSummaryAsync(Guid ownerId, Guid? copropertyId = null);
}
