using Microsoft.EntityFrameworkCore;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;

namespace Myb.Coproperty.Infrastructure.Repositories;

/// <summary>
/// Repository interface for invoice operations
/// </summary>
public interface IInvoiceRepository
{
    Task<CopropertyInvoice?> GetByIdAsync(Guid id);
    Task<List<CopropertyInvoice>> GetByUnitIdAsync(Guid unitId);
    Task<List<CopropertyInvoice>> GetByCopropertyIdAsync(Guid copropertyId);
    Task<List<CopropertyInvoice>> GetOverdueInvoicesAsync(Guid copropertyId);
    Task<List<CopropertyInvoice>> GetUnpaidInvoicesAsync(Guid copropertyId);
    Task<CopropertyInvoice> CreateAsync(CopropertyInvoice invoice);
    Task UpdateAsync(CopropertyInvoice invoice);
    Task DeleteAsync(Guid id);
    Task<List<CopropertyInvoice>> GetByChargeIdAsync(Guid chargeId);
    Task<List<CopropertyInvoice>> GetByStatusAsync(InvoiceStatus status);
    Task<List<CopropertyInvoice>> GetByOwnerUserIdAsync(Guid ownerUserId);
}

/// <summary>
/// Repository implementation for invoice operations
/// </summary>
public class InvoiceRepository : IInvoiceRepository
{
    private readonly CopropertyDbContext _context;

    public InvoiceRepository(CopropertyDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get invoice by ID with all related data
    /// </summary>
    public async Task<CopropertyInvoice?> GetByIdAsync(Guid id)
    {
        return await _context.CopropertyInvoices
            .IgnoreQueryFilters()
            .Include(i => i.Unit)
            .Include(i => i.Owner)
            .Include(i => i.Charge)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == id);
    }

    /// <summary>
    /// Get all invoices for a specific unit
    /// </summary>
    public async Task<List<CopropertyInvoice>> GetByUnitIdAsync(Guid unitId)
    {
        return await _context.CopropertyInvoices
            .IgnoreQueryFilters()
            .Where(i => i.UnitId == unitId)
            .Include(i => i.Owner)
            .Include(i => i.Charge)
            .Include(i => i.Payments)
            .OrderByDescending(i => i.InvoiceDate)
            .ToListAsync();
    }

    /// <summary>
    /// Get all invoices for a coproperty
    /// </summary>
    public async Task<List<CopropertyInvoice>> GetByCopropertyIdAsync(Guid copropertyId)
    {
        return await _context.CopropertyInvoices
            .IgnoreQueryFilters()
            .Where(i => i.Charge.CopropertyId == copropertyId)
            .Include(i => i.Unit)
            .Include(i => i.Owner)
            .Include(i => i.Charge)
            .Include(i => i.Payments)
            .OrderByDescending(i => i.InvoiceDate)
            .ToListAsync();
    }

    /// <summary>
    /// Get overdue invoices for a coproperty
    /// </summary>
    public async Task<List<CopropertyInvoice>> GetOverdueInvoicesAsync(Guid copropertyId)
    {
        var now = DateTime.UtcNow;
        return await _context.CopropertyInvoices
            .IgnoreQueryFilters()
            .Where(i => i.Charge.CopropertyId == copropertyId &&
                       (i.Status == InvoiceStatus.Pending || i.Status == InvoiceStatus.PartiallyPaid) &&
                       i.DueDate < now)
            .Include(i => i.Unit)
            .Include(i => i.Owner)
            .Include(i => i.Charge)
            .Include(i => i.Payments)
            .OrderBy(i => i.DueDate)
            .ToListAsync();
    }

    /// <summary>
    /// Get unpaid invoices for a coproperty
    /// </summary>
    public async Task<List<CopropertyInvoice>> GetUnpaidInvoicesAsync(Guid copropertyId)
    {
        return await _context.CopropertyInvoices
            .IgnoreQueryFilters()
            .Where(i => i.Charge.CopropertyId == copropertyId &&
                       (i.Status == InvoiceStatus.Pending || i.Status == InvoiceStatus.PartiallyPaid || i.Status == InvoiceStatus.Overdue))
            .Include(i => i.Unit)
            .Include(i => i.Owner)
            .Include(i => i.Charge)
            .Include(i => i.Payments)
            .OrderByDescending(i => i.InvoiceDate)
            .ToListAsync();
    }

    /// <summary>
    /// Create a new invoice
    /// </summary>
    public async Task<CopropertyInvoice> CreateAsync(CopropertyInvoice invoice)
    {
        _context.CopropertyInvoices.Add(invoice);
        await _context.SaveChangesAsync();
        return invoice;
    }

    /// <summary>
    /// Update an existing invoice
    /// </summary>
    public async Task UpdateAsync(CopropertyInvoice invoice)
    {
        invoice.UpdatedAt = DateTime.UtcNow;
        _context.CopropertyInvoices.Update(invoice);
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Delete an invoice
    /// </summary>
    public async Task DeleteAsync(Guid id)
    {
        var invoice = await _context.CopropertyInvoices.FindAsync(id);
        if (invoice != null)
        {
            _context.CopropertyInvoices.Remove(invoice);
            await _context.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Get all invoices generated from a specific charge
    /// </summary>
    public async Task<List<CopropertyInvoice>> GetByChargeIdAsync(Guid chargeId)
    {
        return await _context.CopropertyInvoices
            .IgnoreQueryFilters()
            .Where(i => i.ChargeId == chargeId)
            .Include(i => i.Unit)
            .Include(i => i.Owner)
            .Include(i => i.Payments)
            .OrderByDescending(i => i.InvoiceDate)
            .ToListAsync();
    }

    /// <summary>
    /// Get all invoices with a specific status
    /// </summary>
    public async Task<List<CopropertyInvoice>> GetByStatusAsync(InvoiceStatus status)
    {
        return await _context.CopropertyInvoices
            .IgnoreQueryFilters()
            .Where(i => i.Status == status)
            .Include(i => i.Unit)
            .Include(i => i.Owner)
            .Include(i => i.Charge)
            .Include(i => i.Payments)
            .OrderByDescending(i => i.InvoiceDate)
            .ToListAsync();
    }

    /// <summary>
    /// Get all invoices for an owner identified by their Keycloak user ID
    /// </summary>
    public async Task<List<CopropertyInvoice>> GetByOwnerUserIdAsync(Guid ownerUserId)
    {
        return await _context.CopropertyInvoices
            .IgnoreQueryFilters()
            .Where(i => i.Owner.UserId == ownerUserId)
            .Include(i => i.Unit)
            .Include(i => i.Owner)
            .Include(i => i.Charge)
            .Include(i => i.Payments)
            .OrderByDescending(i => i.InvoiceDate)
            .ToListAsync();
    }
}
