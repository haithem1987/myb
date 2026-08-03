using HotChocolate;
using HotChocolate.Types;
using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Models;
using Myb.Coproperty.Services;
using System.Security.Claims;

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
        ClaimsPrincipal? user,
        [Service] IInvoiceRepository invoiceRepository,
        [Service] ICopropertyService copropertyService)
    {
        var invoice = await invoiceRepository.GetByIdAsync(id);
        if (invoice != null)
            await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, invoice.CopropertyId, copropertyService);
        return invoice;
    }

    /// <summary>
    /// Get all invoices for a unit
    /// </summary>
    public async Task<List<CopropertyInvoice>> GetInvoicesByUnit(
        Guid unitId,
        ClaimsPrincipal? user,
        [Service] IInvoiceRepository invoiceRepository,
        [Service] IUnitService unitService,
        [Service] ICopropertyService copropertyService)
    {
        var unit = await unitService.GetByIdAsync(unitId);
        await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, unit.CopropertyId, copropertyService);
        return await invoiceRepository.GetByUnitIdAsync(unitId);
    }

    /// <summary>
    /// Get all invoices for a coproperty
    /// </summary>
    public async Task<List<CopropertyInvoice>> GetInvoicesByCoproperty(
        Guid copropertyId,
        ClaimsPrincipal? user,
        [Service] IInvoiceRepository invoiceRepository,
        [Service] ICopropertyService copropertyService)
    {
        await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, copropertyId, copropertyService);
        return await invoiceRepository.GetByCopropertyIdAsync(copropertyId);
    }

    /// <summary>
    /// Get overdue invoices for a coproperty
    /// </summary>
    public async Task<List<CopropertyInvoice>> GetOverdueInvoices(
        Guid copropertyId,
        ClaimsPrincipal? user,
        [Service] IInvoiceRepository invoiceRepository,
        [Service] ICopropertyService copropertyService)
    {
        await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, copropertyId, copropertyService);
        return await invoiceRepository.GetOverdueInvoicesAsync(copropertyId);
    }

    /// <summary>
    /// Get unpaid invoices for a coproperty
    /// </summary>
    public async Task<List<CopropertyInvoice>> GetUnpaidInvoices(
        Guid copropertyId,
        ClaimsPrincipal? user,
        [Service] IInvoiceRepository invoiceRepository,
        [Service] ICopropertyService copropertyService)
    {
        await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, copropertyId, copropertyService);
        return await invoiceRepository.GetUnpaidInvoicesAsync(copropertyId);
    }

    /// <summary>
    /// Get invoices generated from a specific charge
    /// </summary>
    public async Task<List<CopropertyInvoice>> GetInvoicesByCharge(
        Guid chargeId,
        ClaimsPrincipal? user,
        [Service] IInvoiceRepository invoiceRepository,
        [Service] IChargeService chargeService,
        [Service] ICopropertyService copropertyService)
    {
        var charge = await chargeService.GetByIdAsync(chargeId);
        await CopropertyAccessControl.EnsureCopropertyOwnershipAsync(user, charge.CopropertyId, copropertyService);
        return await invoiceRepository.GetByChargeIdAsync(chargeId);
    }

    /// <summary>
    /// Get all invoices for an owner (identified by Keycloak user ID)
    /// </summary>
    public async Task<List<CopropertyInvoice>> GetInvoicesByOwner(
        Guid ownerId,
        ClaimsPrincipal? user,
        [Service] IInvoiceRepository invoiceRepository,
        [Service] ICopropertyService copropertyService)
    {
        var invoices = await invoiceRepository.GetByOwnerUserIdAsync(ownerId);
        var scopedIds = await CopropertyAccessControl.GetScopedCopropertyIdsAsync(user, copropertyService);
        if (scopedIds == null)
            return invoices;

        return invoices.Where(invoice => scopedIds.Contains(invoice.CopropertyId)).ToList();
    }
}
