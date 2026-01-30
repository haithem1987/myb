using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Models;
using Myb.Coproperty.Models.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Myb.Coproperty.Services;

/// <summary>
/// Service interface for fund call operations
/// </summary>
public interface IFundCallService
{
    Task<FundCall> CreateAsync(CreateFundCallInput input, string userId);
    Task<FundCall> UpdateAsync(Guid id, CreateFundCallInput input, string userId);
    Task DeleteAsync(Guid id);
    Task<FundCall?> GetByIdAsync(Guid id);
    Task<List<FundCall>> GetByCopropertyIdAsync(Guid copropertyId);
    Task<List<CopropertyInvoice>> GenerateInvoicesFromFundCallAsync(Guid fundCallId, string userId);
}

/// <summary>
/// Service implementation for fund call operations
/// </summary>
public class FundCallService : IFundCallService
{
    private readonly IDbContextFactory<CopropertyDbContext> _contextFactory;

    public FundCallService(IDbContextFactory<CopropertyDbContext> contextFactory)
    {
        _contextFactory = contextFactory;
    }

    public async Task<FundCall> CreateAsync(CreateFundCallInput input, string userId)
    {
        if (!input.CopropertyId.HasValue || input.CopropertyId.Value == Guid.Empty)
        {
            throw new ArgumentException("CopropertyId is required to create a fund call");
        }

        using var context = _contextFactory.CreateDbContext();
        
        // Verify coproperty exists
        var copropertyExists = await context.Coproperties
            .AnyAsync(c => c.Id == input.CopropertyId.Value);
        
        if (!copropertyExists)
        {
            throw new ArgumentException($"Coproperty with ID {input.CopropertyId.Value} not found");
        }
        
        var fundCall = new FundCall
        {
            Id = Guid.NewGuid(),
            CopropertyId = input.CopropertyId.Value,
            Amount = input.Amount,
            DueDate = input.DueDate,
            Description = input.Description,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = Guid.TryParse(userId, out var userGuid) ? userGuid : Guid.Empty,
            UpdatedAt = DateTime.UtcNow
        };

        context.FundCalls.Add(fundCall);
        await context.SaveChangesAsync();

        return fundCall;
    }

    public async Task<FundCall> UpdateAsync(Guid id, CreateFundCallInput input, string userId)
    {
        using var context = _contextFactory.CreateDbContext();
        
        var fundCall = await context.FundCalls.FindAsync(id);
        if (fundCall == null)
            throw new InvalidOperationException($"FundCall with ID {id} not found");

        fundCall.Amount = input.Amount;
        fundCall.DueDate = input.DueDate;
        fundCall.Description = input.Description;
        fundCall.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();

        return fundCall;
    }

    public async Task DeleteAsync(Guid id)
    {
        using var context = _contextFactory.CreateDbContext();
        
        var fundCall = await context.FundCalls.FindAsync(id);
        if (fundCall != null)
        {
            context.FundCalls.Remove(fundCall);
            await context.SaveChangesAsync();
        }
    }

    public async Task<FundCall?> GetByIdAsync(Guid id)
    {
        using var context = _contextFactory.CreateDbContext();
        
        return await context.FundCalls
            .Include(f => f.Coproperty)
            .Include(f => f.Invoices)
            .FirstOrDefaultAsync(f => f.Id == id);
    }

    public async Task<List<FundCall>> GetByCopropertyIdAsync(Guid copropertyId)
    {
        using var context = _contextFactory.CreateDbContext();
        
        return await context.FundCalls
            .Where(f => f.CopropertyId == copropertyId)
            .Include(f => f.Invoices)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<CopropertyInvoice>> GenerateInvoicesFromFundCallAsync(Guid fundCallId, string userId)
    {
        using var context = _contextFactory.CreateDbContext();
        
        var fundCall = await context.FundCalls
            .Include(f => f.Coproperty)
            .FirstOrDefaultAsync(f => f.Id == fundCallId);
        
        if (fundCall == null)
            throw new InvalidOperationException($"FundCall with ID {fundCallId} not found");

        var coproperty = await context.Coproperties
            .Include(c => c.Units)
            .ThenInclude(u => u.Owners)
            .FirstOrDefaultAsync(c => c.Id == fundCall.CopropertyId);

        if (coproperty == null)
            throw new InvalidOperationException($"Coproperty with ID {fundCall.CopropertyId} not found");

        var invoices = new List<CopropertyInvoice>();
        var totalShares = coproperty.Units.Sum(u => u.Shares);

        foreach (var unit in coproperty.Units)
        {
            if (unit.Owners.Any())
            {
                var sharePercentage = totalShares > 0 ? (decimal)unit.Shares / totalShares : 0;
                var unitAmount = fundCall.Amount * sharePercentage;

                var owner = unit.Owners.First();

                var invoice = new CopropertyInvoice
                {
                    Id = Guid.NewGuid(),
                    CopropertyId = fundCall.CopropertyId,
                    UnitId = unit.Id,
                    OwnerId = owner.Id,
                    InvoiceNumber = $"FC-{fundCall.Id.ToString().Substring(0, 8)}-{unit.UnitNumber}",
                    TotalAmount = unitAmount,
                    DueDate = fundCall.DueDate,
                    Status = InvoiceStatus.Pending,
                    Description = fundCall.Description,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = Guid.TryParse(userId, out var userGuid) ? userGuid : Guid.Empty
                };

                context.CopropertyInvoices.Add(invoice);
                invoices.Add(invoice);
            }
        }

        await context.SaveChangesAsync();

        return invoices;
    }
}
