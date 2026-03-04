using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.GraphQL.Queries;

/// <summary>
/// GraphQL queries for invoice operations
/// </summary>
[ExtendObjectType("Query")]
public class InvoiceQueries
{
    /// <summary>
    /// Get invoice by ID
    /// </summary>
    public async Task<CopropertyInvoice?> GetInvoiceById(
        Guid id,
        [Service] IInvoiceRepository invoiceRepository) =>
        await invoiceRepository.GetByIdAsync(id);

    /// <summary>
    /// Get all invoices for a unit
    /// </summary>
    public async Task<List<CopropertyInvoice>> GetInvoicesByUnit(
        Guid unitId,
        [Service] IInvoiceRepository invoiceRepository) =>
        await invoiceRepository.GetByUnitIdAsync(unitId);

    /// <summary>
    /// Get all invoices for a coproperty
    /// </summary>
    public async Task<List<CopropertyInvoice>> GetInvoicesByCoproperty(
        Guid copropertyId,
        [Service] IInvoiceRepository invoiceRepository) =>
        await invoiceRepository.GetByCopropertyIdAsync(copropertyId);

    /// <summary>
    /// Get overdue invoices for a coproperty
    /// </summary>
    public async Task<List<CopropertyInvoice>> GetOverdueInvoices(
        Guid copropertyId,
        [Service] IInvoiceRepository invoiceRepository) =>
        await invoiceRepository.GetOverdueInvoicesAsync(copropertyId);

    /// <summary>
    /// Get unpaid invoices for a coproperty
    /// </summary>
    public async Task<List<CopropertyInvoice>> GetUnpaidInvoices(
        Guid copropertyId,
        [Service] IInvoiceRepository invoiceRepository) =>
        await invoiceRepository.GetUnpaidInvoicesAsync(copropertyId);

    /// <summary>
    /// Get invoices generated from a specific charge
    /// </summary>
    public async Task<List<CopropertyInvoice>> GetInvoicesByCharge(
        Guid chargeId,
        [Service] IInvoiceRepository invoiceRepository) =>
        await invoiceRepository.GetByChargeIdAsync(chargeId);

    /// <summary>
    /// Get all invoices for an owner (identified by Keycloak user ID)
    /// </summary>
    public async Task<List<CopropertyInvoice>> GetInvoicesByOwner(
        Guid ownerId,
        [Service] IInvoiceRepository invoiceRepository) =>
        await invoiceRepository.GetByOwnerUserIdAsync(ownerId);
}
