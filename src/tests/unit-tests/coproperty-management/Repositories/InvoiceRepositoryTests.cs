using Xunit;
using Myb.Coproperty.Infrastructure.Data;
using Myb.Coproperty.Infrastructure.Repositories;
using Myb.Coproperty.Models;
using Microsoft.EntityFrameworkCore;

namespace CopropertyManagement.Tests.Repositories;

/// <summary>
/// Unit tests for InvoiceRepository
/// </summary>
public class InvoiceRepositoryTests
{
    private readonly CopropertyDbContext _dbContext;
    private readonly InvoiceRepository _repository;

    public InvoiceRepositoryTests()
    {
        // Setup in-memory database
        var options = new DbContextOptionsBuilder<CopropertyDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _dbContext = new CopropertyDbContext(options);
        _repository = new InvoiceRepository(_dbContext);
    }

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ReturnsInvoiceWithRelatedData()
    {
        // Arrange
        var invoice = CreateSampleInvoice();
        _dbContext.CopropertyInvoices.Add(invoice);
        await _dbContext.SaveChangesAsync();

        // Act
        var result = await _repository.GetByIdAsync(invoice.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(invoice.Id, result.Id);
        Assert.Equal(invoice.InvoiceNumber, result.InvoiceNumber);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNullWhenNotFound()
    {
        // Act
        var result = await _repository.GetByIdAsync(Guid.NewGuid());

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region GetByUnitIdAsync Tests

    [Fact]
    public async Task GetByUnitIdAsync_ReturnsAllInvoicesForUnit()
    {
        // Arrange
        var unitId = Guid.NewGuid();
        var invoices = new[]
        {
            CreateSampleInvoice(unitId),
            CreateSampleInvoice(unitId),
            CreateSampleInvoice(Guid.NewGuid()) // Different unit
        };
        _dbContext.CopropertyInvoices.AddRange(invoices);
        await _dbContext.SaveChangesAsync();

        // Act
        var result = await _repository.GetByUnitIdAsync(unitId);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, inv => Assert.Equal(unitId, inv.UnitId));
    }

    [Fact]
    public async Task GetByUnitIdAsync_ReturnsEmptyListWhenNoInvoices()
    {
        // Act
        var result = await _repository.GetByUnitIdAsync(Guid.NewGuid());

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetByUnitIdAsync_ReturnsSortedByDateDescending()
    {
        // Arrange
        var unitId = Guid.NewGuid();
        var invoice1 = CreateSampleInvoice(unitId);
        invoice1.InvoiceDate = DateTime.UtcNow.AddDays(-10);

        var invoice2 = CreateSampleInvoice(unitId);
        invoice2.InvoiceDate = DateTime.UtcNow;

        _dbContext.CopropertyInvoices.AddRange(invoice1, invoice2);
        await _dbContext.SaveChangesAsync();

        // Act
        var result = await _repository.GetByUnitIdAsync(unitId);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.True(result[0].InvoiceDate >= result[1].InvoiceDate);
    }

    #endregion

    #region GetByCopropertyIdAsync Tests

    [Fact]
    public async Task GetByCopropertyIdAsync_ReturnsAllInvoicesForCoproperty()
    {
        // Arrange
        var charge1 = CreateSampleCharge(Guid.NewGuid());
        var charge2 = CreateSampleCharge(Guid.Parse("00000000-0000-0000-0000-000000000001"));

        var invoice1 = CreateSampleInvoice(chargeId: charge1.Id);
        var invoice2 = CreateSampleInvoice(chargeId: charge1.Id);
        var invoice3 = CreateSampleInvoice(chargeId: charge2.Id);

        _dbContext.Charges.AddRange(charge1, charge2);
        _dbContext.CopropertyInvoices.AddRange(invoice1, invoice2, invoice3);
        await _dbContext.SaveChangesAsync();

        // Act
        var result = await _repository.GetByCopropertyIdAsync(charge1.CopropertyId);

        // Assert
        Assert.Equal(2, result.Count);
    }

    #endregion

    #region GetOverdueInvoicesAsync Tests

    [Fact]
    public async Task GetOverdueInvoicesAsync_ReturnsOnlyUnpaidPastDue()
    {
        // Arrange
        var copropertyId = Guid.NewGuid();
        var charge = CreateSampleCharge(copropertyId);

        // Paid invoice (should not be included)
        var paidInvoice = CreateSampleInvoice(chargeId: charge.Id);
        paidInvoice.Status = InvoiceStatus.Paid;
        paidInvoice.DueDate = DateTime.UtcNow.AddDays(-1);

        // Pending overdue invoice (should be included)
        var overdueInvoice = CreateSampleInvoice(chargeId: charge.Id);
        overdueInvoice.Status = InvoiceStatus.Pending;
        overdueInvoice.DueDate = DateTime.UtcNow.AddDays(-5);

        // Pending not yet due invoice (should not be included)
        var futureInvoice = CreateSampleInvoice(chargeId: charge.Id);
        futureInvoice.Status = InvoiceStatus.Pending;
        futureInvoice.DueDate = DateTime.UtcNow.AddDays(10);

        _dbContext.Charges.Add(charge);
        _dbContext.CopropertyInvoices.AddRange(paidInvoice, overdueInvoice, futureInvoice);
        await _dbContext.SaveChangesAsync();

        // Act
        var result = await _repository.GetOverdueInvoicesAsync(copropertyId);

        // Assert
        Assert.Single(result);
        Assert.Equal(overdueInvoice.Id, result[0].Id);
    }

    [Fact]
    public async Task GetOverdueInvoicesAsync_ReturnsSortedByDueDate()
    {
        // Arrange
        var copropertyId = Guid.NewGuid();
        var charge = CreateSampleCharge(copropertyId);

        var invoice1 = CreateSampleInvoice(chargeId: charge.Id);
        invoice1.Status = InvoiceStatus.Pending;
        invoice1.DueDate = DateTime.UtcNow.AddDays(-10);

        var invoice2 = CreateSampleInvoice(chargeId: charge.Id);
        invoice2.Status = InvoiceStatus.Pending;
        invoice2.DueDate = DateTime.UtcNow.AddDays(-5);

        _dbContext.Charges.Add(charge);
        _dbContext.CopropertyInvoices.AddRange(invoice1, invoice2);
        await _dbContext.SaveChangesAsync();

        // Act
        var result = await _repository.GetOverdueInvoicesAsync(copropertyId);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.True(result[0].DueDate <= result[1].DueDate);
    }

    #endregion

    #region GetUnpaidInvoicesAsync Tests

    [Fact]
    public async Task GetUnpaidInvoicesAsync_ReturnsAllUnpaidStatuses()
    {
        // Arrange
        var copropertyId = Guid.NewGuid();
        var charge = CreateSampleCharge(copropertyId);

        var pending = CreateSampleInvoice(chargeId: charge.Id);
        pending.Status = InvoiceStatus.Pending;

        var partiallyPaid = CreateSampleInvoice(chargeId: charge.Id);
        partiallyPaid.Status = InvoiceStatus.PartiallyPaid;

        var overdue = CreateSampleInvoice(chargeId: charge.Id);
        overdue.Status = InvoiceStatus.Overdue;

        var paid = CreateSampleInvoice(chargeId: charge.Id);
        paid.Status = InvoiceStatus.Paid;

        _dbContext.Charges.Add(charge);
        _dbContext.CopropertyInvoices.AddRange(pending, partiallyPaid, overdue, paid);
        await _dbContext.SaveChangesAsync();

        // Act
        var result = await _repository.GetUnpaidInvoicesAsync(copropertyId);

        // Assert
        Assert.Equal(3, result.Count);
        Assert.DoesNotContain(paid, result);
    }

    #endregion

    #region GetByChargeIdAsync Tests

    [Fact]
    public async Task GetByChargeIdAsync_ReturnsInvoicesForCharge()
    {
        // Arrange
        var chargeId = Guid.NewGuid();
        var invoice1 = CreateSampleInvoice(chargeId: chargeId);
        var invoice2 = CreateSampleInvoice(chargeId: chargeId);
        var invoice3 = CreateSampleInvoice(chargeId: Guid.NewGuid());

        _dbContext.CopropertyInvoices.AddRange(invoice1, invoice2, invoice3);
        await _dbContext.SaveChangesAsync();

        // Act
        var result = await _repository.GetByChargeIdAsync(chargeId);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, inv => Assert.Equal(chargeId, inv.ChargeId));
    }

    #endregion

    #region GetByStatusAsync Tests

    [Fact]
    public async Task GetByStatusAsync_ReturnsInvoicesByStatus()
    {
        // Arrange
        var invoices = new[]
        {
            CreateSampleInvoice(),
            CreateSampleInvoice(),
            CreateSampleInvoice()
        };
        invoices[0].Status = InvoiceStatus.Pending;
        invoices[1].Status = InvoiceStatus.Paid;
        invoices[2].Status = InvoiceStatus.Pending;

        _dbContext.CopropertyInvoices.AddRange(invoices);
        await _dbContext.SaveChangesAsync();

        // Act
        var result = await _repository.GetByStatusAsync(InvoiceStatus.Pending);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, inv => Assert.Equal(InvoiceStatus.Pending, inv.Status));
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_PersistsInvoice()
    {
        // Arrange
        var invoice = CreateSampleInvoice();

        // Act
        await _repository.CreateAsync(invoice);

        // Assert
        var result = await _dbContext.CopropertyInvoices.FindAsync(invoice.Id);
        Assert.NotNull(result);
        Assert.Equal(invoice.InvoiceNumber, result.InvoiceNumber);
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_UpdatesInvoice()
    {
        // Arrange
        var invoice = CreateSampleInvoice();
        _dbContext.CopropertyInvoices.Add(invoice);
        await _dbContext.SaveChangesAsync();

        invoice.Status = InvoiceStatus.Paid;

        // Act
        await _repository.UpdateAsync(invoice);

        // Assert
        var result = await _dbContext.CopropertyInvoices.FindAsync(invoice.Id);
        Assert.Equal(InvoiceStatus.Paid, result?.Status);
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_RemovesInvoice()
    {
        // Arrange
        var invoice = CreateSampleInvoice();
        _dbContext.CopropertyInvoices.Add(invoice);
        await _dbContext.SaveChangesAsync();

        // Act
        await _repository.DeleteAsync(invoice.Id);

        // Assert
        var result = await _dbContext.CopropertyInvoices.FindAsync(invoice.Id);
        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteAsync_DoesNothingWhenNotFound()
    {
        // Act & Assert - should not throw
        await _repository.DeleteAsync(Guid.NewGuid());
    }

    #endregion

    #region Helper Methods

    private CopropertyInvoice CreateSampleInvoice(Guid? unitId = null, Guid? chargeId = null)
    {
        return new CopropertyInvoice
        {
            Id = Guid.NewGuid(),
            InvoiceNumber = $"INV-{Guid.NewGuid():N}".Substring(0, 20),
            ChargeId = chargeId ?? Guid.NewGuid(),
            UnitId = unitId ?? Guid.NewGuid(),
            Amount = 1000,
            TaxAmount = 100,
            TotalAmount = 1100,
            InvoiceDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(30),
            Status = InvoiceStatus.Pending,
            CreatedBy = "test",
            CreatedAt = DateTime.UtcNow
        };
    }

    private Charge CreateSampleCharge(Guid copropertyId)
    {
        return new Charge
        {
            Id = Guid.NewGuid(),
            CopropertyId = copropertyId,
            Name = "Test Charge",
            Amount = 1000,
            CreatedAt = DateTime.UtcNow
        };
    }

    #endregion
}
